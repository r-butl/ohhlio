import React, { useEffect, useState, useCallback } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './Renderer.css';
import TextEditor from '../text-editor/TextEditor';
import ImageEditor from '../image-editor/ImageEditor';
import GridItem from '../grid-item/GridItem';
import { ContentItem } from '../../components/types/ContentItem';

const ResponsiveGrid = WidthProvider(Responsive);

const defaultLayout = {
  minW: 4,
  maxW: 24,
  minH: 3,
  maxH: 24,
};

interface RendererProps {
  isEditMode?: boolean;
  isEditing?: boolean;
  contentSchema?: ContentItem[];
  onContentChange?: (content: ContentItem[]) => void;
  onEditingStateChange?: (editing: boolean) => void;
}

const Renderer: React.FC<RendererProps> = ({
  isEditMode = false,
  contentSchema = [],
  onContentChange,
  onEditingStateChange,
}) => {
  const [editingMap, setEditingMap] = useState<Record<string, boolean>>({});
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [isOptionsHovered, setOptionsHovered] = useState(false);

  const isDraggable = isEditMode && !Object.values(editingMap).some(Boolean) && !isOptionsHovered;

  const handleEditingChange = useCallback((id: string, editing: boolean) => {
    setEditingMap((prev) => ({ ...prev, [id]: editing }));
    setActiveEditor(editing ? id : null);
  }, []);

  useEffect(() => {
    const anyEditing = Object.values(editingMap).some(Boolean);
    onEditingStateChange?.(anyEditing);
  }, [editingMap]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = contentSchema.filter((item) => item.id !== id);
      onContentChange?.(updated);
    },
    [contentSchema, onContentChange]
  );

  const onLayoutChange = (layout: any[]) => {
    const updated = contentSchema.map((item) => {
      const layoutItem = layout.find((l) => l.i === item.id);
      return layoutItem ? { ...item, layout: layoutItem } : item;
    });
    onContentChange?.(updated);
  };

  const renderItem = (item: ContentItem) => {
    const isEditing = editingMap[item.id] || false;
    const isEditable = isEditMode && (!activeEditor || activeEditor === item.id);

    return (
      <div
        key={item.id}
        data-grid={{
          ...item.layout,
          ...defaultLayout,
        }}
        className={isEditMode ? 'edit' : ''}
      >
        <GridItem
          key={item.id}
          isEditable={isEditable}
          isEditing={isEditing}
          onEditingChange={(v) => handleEditingChange(item.id, v)}
          onOptionsHoverChange={setOptionsHovered}
          onDelete={() => handleDelete(item.id)}
        >
          {item.type === 'text' ? (
            <TextEditor isEditing={isEditing} onEditingChange={(v) => handleEditingChange(item.id, v)} />
          ) : (
            <ImageEditor
              isEditing={isEditing}
              onEditingChange={(v) => handleEditingChange(item.id, v)}
              gridWidth={item.layout.w * (1600 / 24)}
              gridHeight={item.layout.h * (1600 / 60)}
            />
          )}
        </GridItem>
      </div>
    );
  };

  // Params for react grid
  const maxWidth = 1600;
  const rowHeight = maxWidth / 60;
  const columnCount = 24;

  return (

    <div style={{ width: '100%', maxWidth: `${maxWidth}px`, margin: '0 auto' }}>
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: contentSchema.map((item) => ({ ...item.layout, ...defaultLayout })) }}
        breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: columnCount, md: columnCount, sm: columnCount, xs: columnCount, xxs: columnCount }}
        rowHeight={rowHeight}
        isDraggable={isDraggable}
        isResizable={isDraggable}
        resizeHandles={['sw', 'se']}
        onLayoutChange={onLayoutChange}
        margin={[5, 5]}
        containerPadding={[1, 1]}
        compactType="vertical"
        preventCollision={false}
      >
        {contentSchema.map(renderItem)}
      </ResponsiveGrid>
    </div>
  );
};

export default Renderer;
