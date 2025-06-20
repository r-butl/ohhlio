import React, { useEffect, useState, useCallback } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './PortfolioRenderer.css';

import TextEditor from '../text-editor/TextEditor';
import ImageEditor from '../image-editor/ImageEditor';
import GridItem from '../grid-item/GridItem';
import { useButtonHover } from '../../hooks/useButtonHover';

import { useEditorStore } from '../../events/EditorStore';

const ResponsiveGrid = WidthProvider(Responsive);

interface RendererProps {}

const Renderer: React.FC<RendererProps> = () => {

  const buttonHovered = useEditorStore(state => state.buttonHovered);

  const mode = useEditorStore(state => state.mode);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const items = useEditorStore(state => state.items);
  const updateLayout = useEditorStore(state => state.updateLayout);

  const isDraggable = mode === 'edit' && (activeEditor === null) && !buttonHovered;
  const isResizable = mode === 'edit' && !buttonHovered;

  console.log(`Draggable: - ${mode} - ${activeEditor === null} - ${!buttonHovered}`);

  const { editorMaxWidth, gridRowHeight, gridColumnCount } = useEditorStore();

  const getTypeSpecificLayout = (type: 'text' | 'image') => {
    const baseLayout = {
      maxW: 24,
      maxH: 24,
    };

    switch (type) {
      case 'text':
        return {
          ...baseLayout,
          minW: 2,  
          minH: 2,
          maxW: 12,
          maxH: 12,
        };
      case 'image':
        return {
          ...baseLayout,
          minW: 2,  
          minH: 2,  
          maxW: 12,
          maxH: 12,
        };
      default:
        return {
          ...baseLayout,
          minW: 1,
          minH: 1,
        };
    }
  };

  const renderItem = (item: typeof items[string]) => {
    const isEditing = activeEditor === item.id || false;
    const isEditable = mode === 'edit' && (!activeEditor || activeEditor === item.id);
    const typeSpecificLayout = getTypeSpecificLayout(item.type);

    return (
      <div
        key={item.id}
        data-grid={{
          ...item.layout,
          ...typeSpecificLayout,
        }}
        className={mode === 'edit' ? 'edit' : ''}
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
              isEditing={isEditing}
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
        layouts={{ lg: Object.values(items).map((item) => ({ ...item.layout })) }}
        breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: gridColumnCount, md: gridColumnCount, sm: gridColumnCount, xs: gridColumnCount, xxs: gridColumnCount }}
        rowHeight={gridRowHeight}
        isDraggable={isDraggable}
        isResizable={isResizable}
        resizeHandles={['sw', 'se']}
        onLayoutChange={updateLayout}
        margin={[5, 5]}
        containerPadding={[1, 1]}
        compactType="vertical"
        preventCollision={false}
      >
        {Object.values(items).map(renderItem)}
      </ResponsiveGrid>
    </div>
  );
};

export default Renderer;
