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
    """Service for preprocessing documents before OCR"""
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    async def convert_pdf_to_images(self, pdf_path: str, dpi: int = 300) -> List[np.ndarray]:
        """Convert PDF to list of images"""
        try:
            images = pdf2image.convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt='RGB'
            )
            
            # Convert PIL images to numpy arrays
            image_arrays = [np.array(img) for img in images]
            logger.info(f"Converted PDF to {len(image_arrays)} images")
            
            return image_arrays
        except Exception as e:
            logger.error(f"Error converting PDF to images: {e}")
            raise
    
    async def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image.copy()
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Increase contrast
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            
            # Threshold (adaptive)
            thresh = cv2.adaptiveThreshold(
                enhanced, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11, 2
            )
            
            # Deskew if needed
            deskewed = self._deskew(thresh)
            
            return deskewed
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image
    
    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """Deskew image to correct orientation"""
        coords = np.column_stack(np.where(image > 0))
        if len(coords) == 0:
            return image
        
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        if abs(angle) < 0.5:  # Skip if almost straight
            return image
        
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        return rotated
    
    async def detect_orientation(self, image: np.ndarray) -> float:
        """Detect image orientation angle"""
        try:
            # Use contours to detect orientation
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY) if len(image.shape) == 3 else image
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)
            
            if lines is not None:
                angles = []
                for rho, theta in lines[:, 0]:
                    angle = np.degrees(theta)
                    angles.append(angle)
                
                # Get median angle
                median_angle = np.median(angles)
                return median_angle
            
            return 0.0
        except Exception as e:
            logger.error(f"Error detecting orientation: {e}")
            return 0.0
    
    async def remove_borders(self, image: np.ndarray, border_size: int = 10) -> np.ndarray:
        """Remove borders from scanned documents"""
        h, w = image.shape[:2]
        return image[border_size:h-border_size, border_size:w-border_size]
    
    async def resize_for_ocr(self, image: np.ndarray, target_height: int = 2000) -> np.ndarray:
        """Resize image to optimal size for OCR"""
        h, w = image.shape[:2]
        if h > target_height:
            ratio = target_height / h
            new_w = int(w * ratio)
            resized = cv2.resize(image, (new_w, target_height), interpolation=cv2.INTER_CUBIC)
            return resized
        return image