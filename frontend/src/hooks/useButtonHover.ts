import { useState, useCallback } from 'react';

export const useButtonHover = (onButtonHoverChange?: (isHovered: boolean) => void) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onButtonHoverChange?.(true);
  }, [onButtonHoverChange]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onButtonHoverChange?.(false);
  }, [onButtonHoverChange]);

  return {
    isHovered,
    handleMouseEnter,
    handleMouseLeave
  };
}; 