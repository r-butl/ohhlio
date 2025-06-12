import { useCallback } from 'react';

export const useClickPropagation = () => {
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return stopPropagation;
}; 