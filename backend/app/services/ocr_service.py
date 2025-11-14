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
    """Multi-engine OCR service supporting Tesseract, PaddleOCR, and EasyOCR"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.gpu_enabled = settings.GPU_ENABLED
        
        # Initialize engines lazily
        self._tesseract_initialized = True  # Always available
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
                    show_log=False
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
                    verbose=False
                )
                logger.info("EasyOCR initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize EasyOCR: {e}")
    
    async def extract_text_tesseract(
        self, 
        image: np.ndarray, 
        page_number: int
    ) -> OCRResult:
        """Extract text using Tesseract"""
        start_time = datetime.utcnow()
        
        try:
            # Run Tesseract in thread pool
            loop = asyncio.get_event_loop()
            
            # Get detailed data including confidence
            data = await loop.run_in_executor(
                self.executor,
                lambda: pytesseract.image_to_data(
                    image,
                    output_type=pytesseract.Output.DICT,
                    config='--psm 6'
                )
            )
            
            # Extract text and calculate average confidence
            texts = []
            confidences = []
            
            for i, conf in enumerate(data['conf']):
                if int(conf) > 0:  # Valid confidence
                    text = data['text'][i].strip()
                    if text:
                        texts.append(text)
                        confidences.append(int(conf))
            
            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            return OCRResult(
                engine=OCREngine.TESSERACT,
                text=full_text,
                confidence=avg_confidence / 100.0,  # Convert to 0-1 scale
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
        """Extract text using PaddleOCR"""
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
            
            texts = []
            confidences = []
            
            if result and result[0]:
                for line in result[0]:
                    if line:
                        text = line[1][0]
                        confidence = line[1][1]
                        texts.append(text)
                        confidences.append(confidence)
            
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
            
            texts = []
            confidences = []
            
            for detection in result:
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
            engines = [OCREngine.TESSERACT, OCREngine.PADDLEOCR, OCREngine.EASYOCR]
        
        tasks = []
        
        for engine in engines:
            if engine == OCREngine.TESSERACT:
                tasks.append(self.extract_text_tesseract(image, page_number))
            elif engine == OCREngine.PADDLEOCR:
                tasks.append(self.extract_text_paddle(image, page_number))
            elif engine == OCREngine.EASYOCR:
                tasks.append(self.extract_text_easy(image, page_number))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = [r for r in results if isinstance(r, OCRResult)]
        
        return valid_results
    
    def select_best_result(self, results: List[OCRResult]) -> OCRResult:
        """Select the best OCR result based on confidence and text length"""
        if not results:
            return None
        
        # Filter results with text
        results_with_text = [r for r in results if r.text and len(r.text) > 10]
        
        if not results_with_text:
            return max(results, key=lambda r: len(r.text))
        
        # Score based on confidence and text length
        scored_results = []
        for result in results_with_text:
            score = result.confidence * 0.7 + (len(result.text) / 1000) * 0.3
            scored_results.append((score, result))
        
        best_result = max(scored_results, key=lambda x: x[0])[1]
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
            else:
                result = await self.extract_text_tesseract(image, page_num)
                all_results.append(result)
        
        return all_results