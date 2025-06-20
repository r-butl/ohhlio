// OptionsPanel.tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './OptionsPanel.css';
import { useEditorStore } from '../../events/EditorStore';
import { OPTION_PAGES } from './OptionsPages';

const OptionsPanel: React.FC<{ id: string, parentRef: React.RefObject<HTMLDivElement> }> = ({ id, parentRef }) => {
  const item = useEditorStore(state => state.items[id]);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const [activePageIndex, setActivePageIndex] = React.useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });


  useEffect(() => {
    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      // Example: place panel to the right of the grid item
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.right + 10 // 10px to the right of the grid item
      });
    }
  }, [parentRef]);

  if (!item || !parentRef.current) return null;

  const pages = OPTION_PAGES[item.type];
  if (!pages) return null;

  const PageComponent = pages[activePageIndex].component;

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
        <h3>Options</h3>
        <button onClick={() => setActiveEditor(null)} className="close-button">×</button>
      </div>
      <div className="panel-content">
        <nav className="options-nav">
          {pages.map((p, i) => (
            <button
              key={p.label}
              className={i === activePageIndex ? 'active' : ''}
              onClick={() => setActivePageIndex(i)}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <div className="options-content">
          <PageComponent id={id} />
        </div>
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default OptionsPanel;
