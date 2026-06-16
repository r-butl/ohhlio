import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/context/EditorStore';
import { OPTION_PAGES } from './OptionsPages';
import './OptionsPanel.css';

const ToolbarOverlay: React.FC = () => {
  const activeEditor = useEditorStore(state => state.activeEditor);
  const activeItem = useEditorStore(state => {
    const activeEditor = state.activeEditor;
    if (!activeEditor) return null;
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === activeEditor);
      if (found) return found;
    }
    return null;
  });
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const updateItemColSpan = useEditorStore(state => state.updateItemColSpan);
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

  if (!activeItem) return null;

  const pages = OPTION_PAGES[activeItem.type];
  if (!pages || pages.length === 0) return null;

  // For now, we'll show the first page (usually "Edit")
  // In the future, we could support multiple pages
  const ToolbarComponent = pages[0].component;

  return createPortal(
    <div
      ref={containerRef}
      className="rounded-xl shadow-xl border border-border bg-background min-w-[220px]"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 2000
      }}
    >
      <div className="relative h-6">
        <button
          onClick={() => setActiveEditor(null)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-4 pb-4 flex flex-col gap-3">
        {activeEditor && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => updateItemColSpan(activeEditor, n)}
                style={{
                  padding: '4px 8px',
                  background: activeItem?.colSpan === n ? '#333' : '#eee',
                  color: activeItem?.colSpan === n ? '#fff' : '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {n}col
              </button>
            ))}
          </div>
        )}
        <ToolbarComponent id={activeEditor} />
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default ToolbarOverlay;
