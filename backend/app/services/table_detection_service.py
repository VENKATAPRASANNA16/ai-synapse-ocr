import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime
import uuid

from ..models.document import TableData

logger = logging.getLogger(__name__)

class TableDetectionService:
    """Service for detecting and extracting tables from documents"""
    
    def __init__(self):
        self.min_table_area = 10000  # Minimum area for table detection
        self.confidence_threshold = 0.7
    
    async def detect_tables(
        self, 
        image: np.ndarray, 
        page_number: int
    ) -> List[Dict]:
        """Detect tables in an image using contour detection"""
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image.copy()
            
            # Threshold
            thresh = cv2.adaptiveThreshold(
                gray, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY_INV, 
                11, 2
            )
            
            # Detect horizontal and vertical lines
            horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
            vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
            
            horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel)
            vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel)
            
            # Combine lines
            table_mask = cv2.add(horizontal_lines, vertical_lines)
            
            # Find contours
            contours, _ = cv2.findContours(
                table_mask, 
                cv2.RETR_EXTERNAL, 
                cv2.CONTOUR_APPROX_SIMPLE
            )
            
            tables = []
            for contour in contours:
                area = cv2.contourArea(contour)
                
                if area > self.min_table_area:
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Basic validation
                    aspect_ratio = w / h
                    if 0.2 < aspect_ratio < 5:  # Reasonable table proportions
                        tables.append({
                            'page_number': page_number,
                            'bounding_box': {
                                'x': int(x),
                                'y': int(y),
                                'width': int(w),
                                'height': int(h)
                            },
                            'area': area
                        })
            
            logger.info(f"Detected {len(tables)} tables on page {page_number}")
            return tables
        
        except Exception as e:
            logger.error(f"Error detecting tables: {e}")
            return []
    
    async def extract_table_data(
        self, 
        image: np.ndarray, 
        table_bbox: Dict,
        page_number: int,
        ocr_text: str = ""
    ) -> TableData:
        """Extract data from detected table"""
        try:
            x = table_bbox['x']
            y = table_bbox['y']
            w = table_bbox['width']
            h = table_bbox['height']
            
            # Crop table region
            table_img = image[y:y+h, x:x+w]
            
            # Detect cells within table
            cells = await self._detect_cells(table_img)
            
            # Organize cells into rows and columns
            structured_data = self._organize_cells(cells, table_img)
            
            # Calculate confidence based on cell detection quality
            confidence = self._calculate_table_confidence(cells, structured_data)
            
            return TableData(
                table_id=str(uuid.uuid4()),
                page_number=page_number,
                bounding_box={
                    'x': float(x),
                    'y': float(y),
                    'width': float(w),
                    'height': float(h)
                },
                rows=len(structured_data),
                columns=len(structured_data[0]) if structured_data else 0,
                data=structured_data,
                confidence=confidence,
                extraction_method="contour_detection"
            )
        
        except Exception as e:
            logger.error(f"Error extracting table data: {e}")
            return TableData(
                table_id=str(uuid.uuid4()),
                page_number=page_number,
                bounding_box=table_bbox,
                rows=0,
                columns=0,
                data=[],
                confidence=0.0,
                extraction_method="failed"
            )
    
    async def _detect_cells(self, table_img: np.ndarray) -> List[Dict]:
        """Detect individual cells within a table"""
        gray = cv2.cvtColor(table_img, cv2.COLOR_RGB2GRAY) if len(table_img.shape) == 3 else table_img
        
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11, 2
        )
        
        # Find cell contours
        contours, _ = cv2.findContours(
            thresh,
            cv2.RETR_TREE,
            cv2.CONTOUR_APPROX_SIMPLE
        )
        
        cells = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Minimum cell size
                x, y, w, h = cv2.boundingRect(contour)
                cells.append({
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h,
                    'center_x': x + w // 2,
                    'center_y': y + h // 2
                })
        
        return cells
    
    def _organize_cells(
        self, 
        cells: List[Dict], 
        table_img: np.ndarray
    ) -> List[List[str]]:
        """Organize detected cells into rows and columns"""
        if not cells:
            return []
        
        # Sort cells by Y position (rows) then X position (columns)
        sorted_cells = sorted(cells, key=lambda c: (c['center_y'], c['center_x']))
        
        # Group into rows based on Y proximity
        rows = []
        current_row = []
        last_y = sorted_cells[0]['center_y']
        y_threshold = 20  # Pixels tolerance for same row
        
        for cell in sorted_cells:
            if abs(cell['center_y'] - last_y) < y_threshold:
                current_row.append(cell)
            else:
                if current_row:
                    rows.append(sorted(current_row, key=lambda c: c['center_x']))
                current_row = [cell]
                last_y = cell['center_y']
        
        if current_row:
            rows.append(sorted(current_row, key=lambda c: c['center_x']))
        
        # Extract text from cells using simple OCR
        structured_data = []
        for row in rows:
            row_data = []
            for cell in row:
                try:
                    x, y, w, h = cell['x'], cell['y'], cell['width'], cell['height']
                    cell_img = table_img[y:y+h, x:x+w]
                    
                    # Simple OCR or placeholder
                    import pytesseract
                    text = pytesseract.image_to_string(cell_img, config='--psm 7').strip()
                    row_data.append(text if text else "")
                except:
                    row_data.append("")
            
            structured_data.append(row_data)
        
        return structured_data
    
    def _calculate_table_confidence(
        self, 
        cells: List[Dict], 
        structured_data: List[List[str]]
    ) -> float:
        """Calculate confidence score for table extraction"""
        if not structured_data or not cells:
            return 0.0
        
        # Factors for confidence:
        # 1. Number of cells detected
        # 2. Regularity of rows/columns
        # 3. Amount of extracted text
        
        cell_score = min(len(cells) / 50.0, 1.0)  # Normalize to max 50 cells
        
        # Check row consistency
        row_lengths = [len(row) for row in structured_data]
        if row_lengths:
            avg_length = sum(row_lengths) / len(row_lengths)
            consistency = 1.0 - (np.std(row_lengths) / (avg_length + 1))
        else:
            consistency = 0.0
        
        # Text extraction score
        total_chars = sum(len(cell) for row in structured_data for cell in row)
        text_score = min(total_chars / 500.0, 1.0)
        
        confidence = (cell_score * 0.3 + consistency * 0.4 + text_score * 0.3)
        
        return round(confidence, 3)
    
    async def process_document_tables(
        self,
        images: List[np.ndarray],
        ocr_results: List = None
    ) -> List[TableData]:
        """Process all tables in a document"""
        all_tables = []
        
        for page_num, image in enumerate(images, start=1):
            # Detect tables
            detected_tables = await self.detect_tables(image, page_num)
            
            # Extract data from each table
            for table_bbox in detected_tables:
                ocr_text = ""
                if ocr_results:
                    page_ocr = [r for r in ocr_results if r.page_number == page_num]
                    ocr_text = page_ocr[0].text if page_ocr else ""
                
                table_data = await self.extract_table_data(
                    image,
                    table_bbox['bounding_box'],
                    page_num,
                    ocr_text
                )
                
                all_tables.append(table_data)
        
        logger.info(f"Extracted {len(all_tables)} tables from document")
        return all_tables