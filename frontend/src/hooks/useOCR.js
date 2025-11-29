import { useContext } from 'react';
import { OCRContext } from '../context/OCRContext';

export const useOCR = () => {
  const context = useContext(OCRContext);
  
  if (!context) {
    throw new Error('useOCR must be used within OCRProvider');
  }
  
  return context;
};