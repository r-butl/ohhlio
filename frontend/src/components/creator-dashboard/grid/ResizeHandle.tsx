import React from 'react';
import { useEditorStore } from '@/context/EditorStore';

interface ResizeHandleProps {
  itemId: string;
  currentColSpan: number;
  itemRef: React.RefObject<HTMLDivElement>;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ itemId, currentColSpan, itemRef }) => {
  const updateItemColSpan = useEditorStore(state => state.updateItemColSpan);
  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startSpan = currentColSpan;
    setButtonHoveredState(true);

    const onMouseUp = (ev: MouseEvent) => {
      if (itemRef.current) {
        // Approximate one column width from the item's current rendered width
        const colWidth = itemRef.current.offsetWidth / currentColSpan;
        const delta = ev.clientX - startX;
        const newSpan = Math.min(4, Math.max(1, Math.round(startSpan + delta / colWidth)));
        updateItemColSpan(itemId, newSpan);
      }
      setButtonHoveredState(false);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '8px',
        height: '40px',
        cursor: 'ew-resize',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: 10,
      }}
      aria-label="Resize item"
    />
  );
};

export default ResizeHandle;
