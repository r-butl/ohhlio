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
  const [visible, setVisible] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeEditor) {
      setPositionReady(false);
      setVisible(false);
      return;
    }
    const gridItem = document.querySelector(`[data-item-id="${activeEditor}"]`);
    if (gridItem) {
      const rect = gridItem.getBoundingClientRect();
      // Start hidden to the right; we'll adjust after measuring actual width
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX + 10,
      });
      setVisible(false);
      setPositionReady(true);
    }
  }, [activeEditor]);

  // After the toolbar renders, measure its actual width and pick the best side
  useEffect(() => {
    if (!positionReady || !containerRef.current || !activeEditor) return;
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const toolbarWidth = containerRef.current.getBoundingClientRect().width;
      const gridItem = document.querySelector(`[data-item-id="${activeEditor}"]`);
      if (gridItem) {
        const itemRect = gridItem.getBoundingClientRect();
        const spaceRight = window.innerWidth - itemRect.right - 10;
        const spaceLeft = itemRect.left - 10;
        let left: number;
        if (spaceRight >= toolbarWidth) {
          left = itemRect.right + window.scrollX + 10;
        } else if (spaceLeft >= toolbarWidth) {
          left = itemRect.left + window.scrollX - toolbarWidth - 10;
        } else {
          // Neither side fits — align to whichever has more room, clamped to viewport
          left = spaceRight >= spaceLeft
            ? Math.min(itemRect.right + window.scrollX + 10, window.innerWidth - toolbarWidth - 8)
            : Math.max(8, itemRect.left + window.scrollX - toolbarWidth - 10);
        }
        setPosition({ top: itemRect.top + window.scrollY, left });
      }
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [positionReady, activeEditor]);

  useEffect(() => {
    if (!activeEditor) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      const gridItem = document.querySelector(`[data-item-id="${activeEditor}"]`);
      if (gridItem && gridItem.contains(target)) return;
      setActiveEditor(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeEditor, setActiveEditor]);

  if (!activeEditor || !positionReady) return null;
  if (!activeItem) return null;

  const pages = OPTION_PAGES[activeItem.type];
  if (!pages || pages.length === 0) return null;

  const ToolbarComponent = pages[0].component;

  return createPortal(
    <div
      ref={containerRef}
      className="rounded-lg shadow-md border border-system bg-system text-system-foreground min-w-[200px]"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 2000,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => updateItemColSpan(activeEditor, n)}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                activeItem.colSpan === n
                  ? 'bg-system-foreground text-system border-transparent'
                  : 'bg-transparent text-system-foreground border-system-foreground/20 hover:bg-system-foreground/10'
              }`}
            >
              {n}col
            </button>
          ))}
        </div>
        <ToolbarComponent id={activeEditor} />
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default ToolbarOverlay;
