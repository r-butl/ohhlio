import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GridItem from './grid-item/GridItem';
import ResizeHandle from './ResizeHandle';
import TextEditor from './text-editor/TextEditor';
import ImageEditor from './image-editor/ImageEditor';
import { useEditorStore } from '@/context/EditorStore';
import type { ItemProps } from '@/interfaces/ProjectItemsInterfaces';

interface SortableGridItemProps {
  item: ItemProps;
  sectionId: string;
}

const SortableGridItem: React.FC<SortableGridItemProps> = ({ item, sectionId }) => {
  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';
  const loadingAssets = useEditorStore(state => state.isLoadingAssets);
  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const itemRef = useRef<HTMLDivElement>(null!);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'item', sectionId },
    disabled: !isOwnerEdit || loadingAssets || buttonHovered,
  });

  const style: React.CSSProperties = {
    gridColumn: `span ${item.colSpan}`,
    // CSS aspect-ratio keeps image cells proportional without any JS height math.
    // Text items have no aspect-ratio so they grow with their content.
    ...(item.type === 'image' ? { aspectRatio: String(item.props.aspectRatio) } : {}),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  return (
    <div ref={el => { setNodeRef(el); (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }} style={style} {...attributes} {...listeners}>
      <GridItem id={item.id}>
        {item.type === 'text' ? (
          <TextEditor id={item.id} {...item.props} />
        ) : (
          <ImageEditor id={item.id} {...item.props} />
        )}
      </GridItem>
      {isOwnerEdit && !loadingAssets && (
        <ResizeHandle itemId={item.id} currentColSpan={item.colSpan} itemRef={itemRef} />
      )}
    </div>
  );
};

export default SortableGridItem;
