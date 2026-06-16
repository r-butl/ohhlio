import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEditorStore } from '@/context/EditorStore';
import SortableSection from './SortableSection';
import ToolbarOverlay from './options-panel/ToolbarOverlay';

const EditorGrid: React.FC = () => {
  const sections = useEditorStore(state => state.currentProject.items.sections);
  const viewState = useEditorStore(state => state.viewState);
  const reorderSections = useEditorStore(state => state.reorderSections);
  const moveItem = useEditorStore(state => state.moveItem);
  const reorderItemWithinSection = useEditorStore(state => state.reorderItemWithinSection);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { type: string; sectionId?: string } | undefined;
    const overData = over.data.current as { type: string; sectionId?: string } | undefined;

    if (!activeData || activeData.type !== 'item') return;

    const fromSectionId = activeData.sectionId;
    const toSectionId = overData?.type === 'item' ? overData.sectionId : over.id as string;

    if (fromSectionId && toSectionId && fromSectionId !== toSectionId) {
      const toSection = sections.find(s => s.id === toSectionId);
      if (!toSection) return;
      const toIdx = overData?.type === 'item'
        ? toSection.items.findIndex(i => i.id === over.id)
        : toSection.items.length;
      moveItem(String(active.id), fromSectionId, toSectionId, toIdx);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type: string; sectionId?: string } | undefined;
    const overData = over.data.current as { type: string; sectionId?: string } | undefined;

    if (activeData?.type === 'section') {
      const fromIdx = sections.findIndex(s => s.id === active.id);
      const toIdx = sections.findIndex(s => s.id === over.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        reorderSections(fromIdx, toIdx);
      }
    } else if (activeData?.type === 'item' && overData?.type === 'item') {
      const sectionId = activeData.sectionId;
      if (sectionId && sectionId === overData.sectionId) {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;
        const fromIdx = section.items.findIndex(i => i.id === active.id);
        const toIdx = section.items.findIndex(i => i.id === over.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          reorderItemWithinSection(sectionId, fromIdx, toIdx);
        }
      }
    }
  };

  const isOwnerEdit = viewState === 'OwnerEdit';

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map(section => (
            <SortableSection key={section.id} section={section} />
          ))}
        </SortableContext>
      </DndContext>

      {isOwnerEdit && sections.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: '48px 0' }}>
          No sections yet. Add one below.
        </div>
      )}

      <footer>
        <div style={{ height: '200px' }} />
      </footer>
      <ToolbarOverlay />
    </div>
  );
};

export default EditorGrid;
