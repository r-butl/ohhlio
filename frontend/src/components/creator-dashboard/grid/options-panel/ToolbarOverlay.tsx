import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/context/EditorStore';
import { OPTION_PAGES } from './OptionsPages';
import './OptionsPanel.css';

const ToolbarOverlay: React.FC = () => {
  const activeEditor = useEditorStore(state => state.activeEditor);
  const items = useEditorStore(state => state.currentProject.items);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeEditor) {
      setPositionReady(false);
      return;
    }

    // Find the grid item element
    const gridItem = document.querySelector(`[data-item-id="${activeEditor}"]`);
    if (gridItem) {
      const rect = gridItem.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.right + 10, // 10px to the right of the grid item
      });
      setPositionReady(true);
    }
  }, [activeEditor]);

  if (!activeEditor || !positionReady) return null;

  const item = items[activeEditor];
  if (!item) return null;

  const pages = OPTION_PAGES[item.type];
  if (!pages || pages.length === 0) return null;

  // For now, we'll show the first page (usually "Edit")
  // In the future, we could support multiple pages
  const ToolbarComponent = pages[0].component;

  return createPortal(
    <div
      ref={containerRef}
      className="options-panel"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 2000
      }}
    >
      <div className="panel-header">
        <button 
          onClick={() => {
            setActiveEditor(null);
          }} 
          className="close-button" 
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="panel-content">
        <div className="options-content">
          <ToolbarComponent id={activeEditor} />
        </div>
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default ToolbarOverlay;

