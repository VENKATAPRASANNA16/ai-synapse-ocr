import cv2
import numpy as np
from PIL import Image
import pdf2image
from typing import List, Tuple
import logging
from pathlib import Path
import tempfile

logger = logging.getLogger(__name__)

class PreprocessingService:
    """Enhanced preprocessing service for better OCR accuracy"""
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    async def convert_pdf_to_images(self, pdf_path: str, dpi: int = 300) -> List[np.ndarray]:
        """Convert PDF to high-quality images"""
        try:
            logger.info(f"Converting PDF: {pdf_path} at {dpi} DPI")
            
            images = pdf2image.convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt='RGB',
                thread_count=2
            )
            
            image_arrays = [np.array(img) for img in images]
            logger.info(f"✅ Converted PDF to {len(image_arrays)} images")
            
            return image_arrays
        except Exception as e:
            logger.error(f"❌ Error converting PDF: {e}")
            raise
    
    async def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Enhanced preprocessing pipeline for OCR"""
        try:
            original_shape = image.shape
            logger.info(f"Preprocessing image: {original_shape}")
            
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image.copy()
            
            # 1. Denoise (remove noise while preserving edges)
            denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
            
            # 2. Increase contrast using CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            
            # 3. Sharpen the image
            kernel_sharpen = np.array([[-1,-1,-1],
                                       [-1, 9,-1],
                                       [-1,-1,-1]])
            sharpened = cv2.filter2D(enhanced, -1, kernel_sharpen)
            
            # 4. Adaptive thresholding for better binarization
            thresh = cv2.adaptiveThreshold(
                sharpened, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize=11,
                C=2
            )
            
            # 5. Deskew if needed
            deskewed = self._deskew(thresh)
            
            # 6. Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(deskewed, cv2.MORPH_CLOSE, kernel)
            
            logger.info("✅ Preprocessing completed successfully")
            return cleaned
            
        except Exception as e:
            logger.error(f"❌ Preprocessing error: {e}")
            # Return original if preprocessing fails
            return image
    
    def _deskew(self, image: np.ndarray, max_angle: float = 10.0) -> np.ndarray:
        """Improved deskewing with angle limits"""
        try:
            coords = np.column_stack(np.where(image > 0))
            if len(coords) == 0:
                return image
            
            angle = cv2.minAreaRect(coords)[-1]
            
            # Normalize angle
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Only deskew if angle is within reasonable range
            if abs(angle) < 0.5:
                return image
            
            if abs(angle) > max_angle:
                logger.warning(f"Angle {angle:.2f}° exceeds max, limiting to {max_angle}°")
                angle = max_angle if angle > 0 else -max_angle
            
            # Rotate image
            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            
            rotated = cv2.warpAffine(
                image, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            
            logger.info(f"Deskewed image by {angle:.2f}°")
            return rotated
            
        except Exception as e:
            logger.error(f"Deskew error: {e}")
            return image
    
    async def detect_orientation(self, image: np.ndarray) -> float:
        """Detect document orientation"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY) if len(image.shape) == 3 else image
            
            # Use Canny edge detection
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            
            # Detect lines
            lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)
            
            if lines is not None:
                angles = []
                for rho, theta in lines[:, 0]:
                    angle = np.degrees(theta)
                    angles.append(angle)
                
                median_angle = np.median(angles)
                return median_angle
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Orientation detection error: {e}")
            return 0.0
    
    async def remove_borders(self, image: np.ndarray, border_size: int = 20) -> np.ndarray:
        """Remove document borders/margins"""
        try:
            h, w = image.shape[:2]
            
            if h > border_size * 2 and w > border_size * 2:
                return image[border_size:h-border_size, border_size:w-border_size]
            
            return image
            
        except Exception as e:
            logger.error(f"Border removal error: {e}")
            return image
    
    async def resize_for_ocr(self, image: np.ndarray, target_height: int = 2000) -> np.ndarray:
        """Resize image to optimal size for OCR"""
        try:
            h, w = image.shape[:2]
            
            # If image is too large, resize
            if h > target_height:
                ratio = target_height / h
                new_w = int(w * ratio)
                resized = cv2.resize(
                    image, 
                    (new_w, target_height), 
                    interpolation=cv2.INTER_CUBIC
                )
                logger.info(f"Resized from {w}x{h} to {new_w}x{target_height}")
                return resized
            
            # If image is too small, upscale
            elif h < 1000:
                ratio = 1500 / h
                new_w = int(w * ratio)
                resized = cv2.resize(
                    image,
                    (new_w, 1500),
                    interpolation=cv2.INTER_CUBIC
                )
                logger.info(f"Upscaled from {w}x{h} to {new_w}x1500")
                return resized
            
            return image
            
        except Exception as e:
            logger.error(f"Resize error: {e}")
            return image
    
    async def auto_rotate(self, image: np.ndarray) -> np.ndarray:
        """Auto-rotate image to correct orientation"""
        try:
            # Detect if image is rotated 90/180/270 degrees
            h, w = image.shape[:2]
            
            # If width > height significantly, might be rotated
            if w > h * 1.5:
                # Try rotating 90 degrees
                rotated = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
                logger.info("Auto-rotated 90° clockwise")
                return rotated
            
            return image
            
        except Exception as e:
            logger.error(f"Auto-rotation error: {e}")
            return image