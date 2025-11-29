export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  JPG: 'image/jpg',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const OCR_ENGINES = [
  { id: 'tesseract', name: 'Tesseract v5', description: 'Open-source OCR engine' },
  { id: 'paddleocr', name: 'PaddleOCR', description: 'Multi-language OCR' },
  { id: 'easyocr', name: 'EasyOCR', description: 'Ready-to-use OCR' },
  { id: 'azure', name: 'Azure Cognitive', description: 'Cloud-based OCR' },
];

export const LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'spa', name: 'Spanish' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  PROCESSING: '/processing',
  QUERY: '/query',
  RESULTS: '/results',
  ANALYTICS: '/analytics',
  MY_FILES: '/my-files',
  SETTINGS: '/settings',
};

export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};