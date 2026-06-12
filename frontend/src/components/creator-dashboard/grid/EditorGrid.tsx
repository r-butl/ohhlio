import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import TextEditor from './text-editor/TextEditor';
import ImageEditor from './image-editor/ImageEditor';
import GridItem from './grid-item/GridItem';
import ToolbarOverlay from './options-panel/ToolbarOverlay';

import { useEditorStore } from '../../../context/EditorStore';

const ResponsiveGrid = WidthProvider(Responsive);

interface RendererProps {}

const EditorGrid: React.FC<RendererProps> = () => {

  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const viewState = useEditorStore(state => state.viewState);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const items = useEditorStore(state => state.currentProject.items);

  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  
  const isOwnerEdit = viewState === 'OwnerEdit';
  const loadingAssets = useEditorStore(state => state.isLoadingAssets);
  const isDraggable = isOwnerEdit && (activeEditor === null) && !buttonHovered;
  const isResizable = isOwnerEdit && !buttonHovered;

  const { editorMaxWidth, gridRowHeight, gridColumnCount } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidthPx, setContainerWidthPx] = useState(0);

  // Measures the outer wrapper's width so image aspect ratios can be derived
  // from real pixel widths at both the lg (4-col) and xs (1-col) breakpoints.
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setContainerWidthPx(width);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleLayoutChange = (layout: any[]) => {
    if (isOwnerEdit && !loadingAssets) {
      console.log('Updating layout in editor store from user interaction');
      setItemsWithHistory(draft => {
        layout.forEach(layoutItem => {
          if (draft[layoutItem.i]) {
            draft[layoutItem.i].layout = layoutItem;
          }
        });
      });
    }
  };

  const generateLayouts = useCallback(() => {
    const itemValues = Object.values(items);
    
    // Desktop layout uses the user-configured layout directly
    const desktopLayout = itemValues.map(item => ({ ...item.layout }));

    // Mobile layout stacks everything in a single column
    const mobileLayout = itemValues.map(item => ({
      ...item.layout,
      w: 1, // Force width to 1 column
      x: 0, // Ensure it's in the first (and only) column
    }));

    return {
      lg: desktopLayout,
      xs: mobileLayout,
    };
  }, [items]);

  const renderItem = (item: typeof items[string]) => {

    return (
      <div
        key={item.id}
        data-grid={{
          ...item.layout,
          minW: item.layout.minW || 1,
          maxW: item.layout.maxW || gridColumnCount,
          minH: item.layout.minH || 1,
          maxH: item.layout.maxH || 100,
        }}
      >
        <GridItem
          id={item.id}
        >
          {item.type === 'text' ? (
            <TextEditor 
              id={item.id}
              {...item.props}
            />
          ) : (
            <ImageEditor
              id={item.id}
              {...item.props}
            />
          )}
        </GridItem>
      </div>
    );
  };

  return (

    <div ref={containerRef} style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
      <ResponsiveGrid
        className="layout"
        layouts={generateLayouts()}
        breakpoints={{ lg: 768, xs: 0 }} 
        cols={{ lg: gridColumnCount, xs: 1 }}
        rowHeight={gridRowHeight}
        isDraggable={isDraggable && !loadingAssets}
        isResizable={isResizable && !loadingAssets}
        resizeHandles={['sw', 'se']}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
        margin={[5, 5]}
        containerPadding={[1, 1]}
        compactType="vertical"
        preventCollision={false}
      >
        {Object.values(items).map(renderItem)}
      </ResponsiveGrid>
      <footer>
            <div
                className='space'
                style={{height: '200px'}}>
            </div>
      </footer>
      <ToolbarOverlay />
    </div>
  );
};

export default EditorGrid;
