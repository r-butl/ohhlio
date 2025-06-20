// OptionsPanel.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './OptionsPanel.css';
import { useEditorStore } from '../../events/EditorStore';
import { OPTION_PAGES } from './OptionsPages';

const OptionsPanel: React.FC<{ id: string, parentRef: React.RefObject<HTMLDivElement> }> = ({ id, parentRef }) => {
  const item = useEditorStore(state => state.items[id]);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const [activePageIndex, setActivePageIndex] = React.useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);

  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);

  const deleteItem = useEditorStore(state => state.deleteItem);

  useEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      // Example: place panel to the right of the grid item
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.right + 10 // 10px to the right of the grid item
      });
      setPositionReady(true);
    }
  }, [parentRef]);

  if (!item || !parentRef.current || !positionReady) return null;

  const pages = OPTION_PAGES[item.type];
  if (!pages) return null;

  return createPortal(
    <div
      className="options-panel"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 2000
      }}
    >
      <div className="panel-header">
        {activePageIndex !== null && (
          <button onClick={() => setActivePageIndex(null)} className="back-button" aria-label="Back">←</button>
        )}
        <button onClick={() => {
          setActiveEditor(null);
          setButtonHoveredState(false);
        }} className="close-button" aria-label="Close">×</button>
      </div>
      <div className="panel-content">
        {activePageIndex === null ? (
          <div className="main-menu">
            <nav className="options-nav">
              {pages.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setActivePageIndex(i)}
                >
                  {p.label}
                </button>
              ))}
            </nav>
            <button onClick={() => { deleteItem(id); setActiveEditor(null); }} className="delete-button">Delete</button>
          </div>
        ) : (
          <div className="options-content">
            {React.createElement(pages[activePageIndex].component, { id })}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default OptionsPanel;
