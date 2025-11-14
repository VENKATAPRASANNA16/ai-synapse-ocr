export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'AI Synapse OCR';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.2.0';

export const USER_ROLES = {
  GUEST: 'guest',
  MEMBER: 'member',
  ADMIN: 'admin'
};

export const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  PREPROCESSING: 'preprocessing',
  OCR_PROCESSING: 'ocr_processing',
  TABLE_EXTRACTION: 'table_extraction',
  EMBEDDING_GENERATION: 'embedding_generation',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const OCR_ENGINES = {
  TESSERACT: 'tesseract',
  PADDLEOCR: 'paddleocr',
  EASYOCR: 'easyocr'
};

export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif']
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const STATUS_COLORS = {
  [DOCUMENT_STATUS.UPLOADED]: 'bg-blue-100 text-blue-800',
  [DOCUMENT_STATUS.PREPROCESSING]: 'bg-yellow-100 text-yellow-800',
  [DOCUMENT_STATUS.OCR_PROCESSING]: 'bg-purple-100 text-purple-800',
  [DOCUMENT_STATUS.TABLE_EXTRACTION]: 'bg-indigo-100 text-indigo-800',
  [DOCUMENT_STATUS.EMBEDDING_GENERATION]: 'bg-pink-100 text-pink-800',
  [DOCUMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [DOCUMENT_STATUS.FAILED]: 'bg-red-100 text-red-800'
};