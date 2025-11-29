import { useContext } from 'react';
import { QueryContext } from '../context/QueryContext';

export const useQuery = () => {
  const context = useContext(QueryContext);
  
  if (!context) {
    throw new Error('useQuery must be used within QueryProvider');
  }
  
  return context;
};