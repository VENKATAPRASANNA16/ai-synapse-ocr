import pytesseract
from paddleocr import PaddleOCR
import easyocr
import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor

from ..models.document import OCRResult, OCREngine
from ..config import settings

logger = logging.getLogger(__name__)

class OCRService:
    """Multi-engine OCR service with improved accuracy"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.gpu_enabled = settings.GPU_ENABLED
        
        # Initialize engines lazily
        self._tesseract_initialized = True
        self._paddle_ocr = None
        self._easy_ocr = None
        
        logger.info(f"OCR Service initialized with GPU: {self.gpu_enabled}")
    
    def _init_paddle_ocr(self):
        """Initialize PaddleOCR"""
        if self._paddle_ocr is None:
            try:
                self._paddle_ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='en',
                    use_gpu=self.gpu_enabled,
                    show_log=False,
                    det_db_thresh=0.3,
                    det_db_box_thresh=0.5
                )
                logger.info("PaddleOCR initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize PaddleOCR: {e}")
    
    def _init_easy_ocr(self):
        """Initialize EasyOCR"""
        if self._easy_ocr is None:
            try:
                self._easy_ocr = easyocr.Reader(
                    ['en'],
                    gpu=self.gpu_enabled,
                    verbose=False,
                    download_enabled=True
                )
                logger.info("EasyOCR initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize EasyOCR: {e}")
    
    async def extract_text_tesseract(
        self, 
        image: np.ndarray, 
        page_number: int
    ) -> OCRResult:
        """Extract text using Tesseract with improved config"""
        start_time = datetime.utcnow()
        
        try:
            loop = asyncio.get_event_loop()
            
            # Enhanced Tesseract config
            config = '--psm 6 --oem 3 -c preserve_interword_spaces=1'
            
            # Get detailed data
            data = await loop.run_in_executor(
                self.executor,
                lambda: pytesseract.image_to_data(
                    image,
                    output_type=pytesseract.Output.DICT,
                    config=config
                )
            )
            
            # Build text with proper spacing
            texts = []
            confidences = []
            last_block = -1
            last_line = -1
            
            for i in range(len(data['text'])):
                conf = int(data['conf'][i])
                if conf > 30:  # Lower threshold for better recall
                    text = data['text'][i].strip()
                    if text:
                        # Add line breaks for new lines/blocks
                        if last_block != data['block_num'][i]:
                            if texts:
                                texts.append('\n\n')
                        elif last_line != data['line_num'][i]:
                            if texts:
                                texts.append('\n')
                        elif texts:
                            texts.append(' ')
                        
                        texts.append(text)
                        confidences.append(conf)
                        last_block = data['block_num'][i]
                        last_line = data['line_num'][i]
            
            full_text = ''.join(texts).strip()
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return OCRResult(
                engine=OCREngine.TESSERACT,
                text=full_text,
                confidence=avg_confidence / 100.0,
                processing_time=processing_time,
                page_number=page_number
            )
        
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            return OCRResult(
                engine=OCREngine.TESSERACT,
                text="",
                confidence=0.0,
                processing_time=(datetime.utcnow() - start_time).total_seconds(),
                page_number=page_number
            )
    
    async def extract_text_paddle(
        self, 
        image: np.ndarray, 
        page_number: int
    ) -> OCRResult:
        """Extract text using PaddleOCR with improved parsing"""
        start_time = datetime.utcnow()
        
        try:
            self._init_paddle_ocr()
            if self._paddle_ocr is None:
                raise Exception("PaddleOCR not available")
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                lambda: self._paddle_ocr.ocr(image, cls=True)
            )
            
            if not result or not result[0]:
                raise Exception("No text detected")
            
            # Sort by vertical position for proper reading order
            lines = []
            for line in result[0]:
                if line:
                    box = line[0]
                    text = line[1][0]
                    confidence = line[1][1]
                    
                    # Get Y coordinate (vertical position)
                    y_pos = sum([point[1] for point in box]) / len(box)
                    
                    lines.append({
                        'y_pos': y_pos,
                        'text': text,
                        'confidence': confidence
                    })
            
            # Sort by Y position
            lines.sort(key=lambda x: x['y_pos'])
            
            # Build text with line breaks
            texts = []
            confidences = []
            last_y = None
            
            for line in lines:
                if last_y is not None and abs(line['y_pos'] - last_y) > 30:
                    texts.append('\n')
                
                texts.append(line['text'])
                confidences.append(line['confidence'])
                last_y = line['y_pos']
            
            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return OCRResult(
                engine=OCREngine.PADDLEOCR,
                text=full_text,
                confidence=avg_confidence,
                processing_time=processing_time,
                page_number=page_number
            )
        
        except Exception as e:
            logger.error(f"PaddleOCR failed: {e}")
            return OCRResult(
                engine=OCREngine.PADDLEOCR,
                text="",
                confidence=0.0,
                processing_time=(datetime.utcnow() - start_time).total_seconds(),
                page_number=page_number
            )
    
    async def extract_text_easy(
        self, 
        image: np.ndarray, 
        page_number: int
    ) -> OCRResult:
        """Extract text using EasyOCR"""
        start_time = datetime.utcnow()
        
        try:
            self._init_easy_ocr()
            if self._easy_ocr is None:
                raise Exception("EasyOCR not available")
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                lambda: self._easy_ocr.readtext(image)
            )
            
            # Sort by position
            sorted_result = sorted(result, key=lambda x: x[0][0][1])
            
            texts = []
            confidences = []
            
            for detection in sorted_result:
                text = detection[1]
                confidence = detection[2]
                texts.append(text)
                confidences.append(confidence)
            
            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return OCRResult(
                engine=OCREngine.EASYOCR,
                text=full_text,
                confidence=avg_confidence,
                processing_time=processing_time,
                page_number=page_number
            )
        
        except Exception as e:
            logger.error(f"EasyOCR failed: {e}")
            return OCRResult(
                engine=OCREngine.EASYOCR,
                text="",
                confidence=0.0,
                processing_time=(datetime.utcnow() - start_time).total_seconds(),
                page_number=page_number
            )
    
    async def extract_text_multi_engine(
        self, 
        image: np.ndarray, 
        page_number: int,
        engines: List[OCREngine] = None
    ) -> List[OCRResult]:
        """Extract text using multiple OCR engines"""
        if engines is None:
            engines = [OCREngine.TESSERACT, OCREngine.PADDLEOCR]
        
        tasks = []
        
        for engine in engines:
            if engine == OCREngine.TESSERACT:
                tasks.append(self.extract_text_tesseract(image, page_number))
            elif engine == OCREngine.PADDLEOCR:
                tasks.append(self.extract_text_paddle(image, page_number))
            elif engine == OCREngine.EASYOCR:
                tasks.append(self.extract_text_easy(image, page_number))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        valid_results = [r for r in results if isinstance(r, OCRResult)]
        
        return valid_results
    
    def select_best_result(self, results: List[OCRResult]) -> OCRResult:
        """Select best OCR result with improved scoring"""
        if not results:
            return None
        
        results_with_text = [r for r in results if r.text and len(r.text) > 10]
        
        if not results_with_text:
            return max(results, key=lambda r: len(r.text)) if results else None
        
        # Improved scoring algorithm
        scored_results = []
        for result in results_with_text:
            # Word count and character count
            word_count = len(result.text.split())
            char_count = len(result.text)
            
            # Score components
            confidence_score = result.confidence * 0.4
            length_score = min(char_count / 2000, 1.0) * 0.3
            word_score = min(word_count / 300, 1.0) * 0.3
            
            total_score = confidence_score + length_score + word_score
            scored_results.append((total_score, result))
        
        best_result = max(scored_results, key=lambda x: x[0])[1]
        logger.info(f"Selected {best_result.engine.value} (conf: {best_result.confidence:.2f}, len: {len(best_result.text)})")
        
        return best_result
    
    async def process_document(
        self,
        images: List[np.ndarray],
        use_multi_engine: bool = True
    ) -> List[OCRResult]:
        """Process entire document with OCR"""
        all_results = []
        
        for page_num, image in enumerate(images, start=1):
            logger.info(f"Processing page {page_num}/{len(images)}")
            
            if use_multi_engine:
                page_results = await self.extract_text_multi_engine(image, page_num)
                best_result = self.select_best_result(page_results)
                if best_result:
                    all_results.append(best_result)
                    logger.info(f"Page {page_num}: {len(best_result.text)} chars extracted")
            else:
                result = await self.extract_text_tesseract(image, page_num)
                all_results.append(result)
        
        return all_results