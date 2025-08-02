import React, { useEffect, useState, useCallback } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import TextEditor from './text-editor/TextEditor';
import ImageEditor from './image-editor/ImageEditor';
import GridItem from './grid-item/GridItem';

import { useEditorStore } from '../../../context/EditorStore';

const ResponsiveGrid = WidthProvider(Responsive);

interface RendererProps {}

const EditorGrid: React.FC<RendererProps> = () => {

  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const mode = useEditorStore(state => state.mode);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const items = useEditorStore(state => state.items);
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  
  const isDraggable = mode === 'edit' && (activeEditor === null) && !buttonHovered;
  const isResizable = mode === 'edit' && !buttonHovered;

  const { editorMaxWidth, gridRowHeight, gridColumnCount } = useEditorStore();

  const handleLayoutChange = (layout: any[]) => {
    if (mode === 'edit') {
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

    <div style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
      <ResponsiveGrid
        className="layout"
        layouts={generateLayouts()}
        breakpoints={{ lg: 768, xs: 0 }} 
        cols={{ lg: gridColumnCount, xs: 1 }}
        rowHeight={gridRowHeight}
        isDraggable={isDraggable}
        isResizable={isResizable}
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
    </div>
  );
};

export default EditorGrid;
