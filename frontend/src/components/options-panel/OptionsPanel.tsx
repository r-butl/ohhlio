// OptionsPanel.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './OptionsPanel.css';
import { useEditorStore } from '../../events/EditorStore';
import { OPTION_PAGES } from './OptionsPages';
import { useContentCheck } from '../../hooks/useContentCheck';

const OptionsPanel: React.FC<{ id: string, parentRef: React.RefObject<HTMLDivElement> }> = ({ id, parentRef }) => {
  const item = useEditorStore(state => state.items[id]);
  const hasContent = useContentCheck(id);
  const [activePageIndex, setActivePageIndex] = React.useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);

  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);
  const setActiveOptionsPanel = useEditorStore( state => state.setActiveOptionsPanel);

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
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 2000
      }}
    >
      <div className="panel-header">
        {activePageIndex !== null && (
          <button onClick={() => {
            setActiveEditor(null);
            setActivePageIndex(null)
          }} className="back-button" aria-label="Back">←</button>
        )}
        {activePageIndex === null && (
            <button onClick={() => {
              setActiveEditor(null);
              setButtonHoveredState(false);
              setActiveOptionsPanel(null);
            }} className="close-button" aria-label="Close">×</button>
          )
        }
      </div>
      <div className="panel-content">
        {activePageIndex === null ? (
          <div className="main-menu">
            { hasContent &&
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
            }
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
