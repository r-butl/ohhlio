import React, { useState } from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/context/EditorStore';
import SortableGridItem from './SortableGridItem';
import type { Section } from '@/interfaces/ProjectItemsInterfaces';
import './BentoGrid.css';

interface SortableSectionProps {
  section: Section;
}

const SortableSection: React.FC<SortableSectionProps> = ({ section }) => {
  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';
  const deleteSection = useEditorStore(state => state.deleteSection);
  const updateSectionTitle = useEditorStore(state => state.updateSectionTitle);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section' },
    disabled: !isOwnerEdit,
  });

  const sectionStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: '24px',
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== section.title) {
      updateSectionTitle(section.id, titleDraft.trim());
    } else {
      setTitleDraft(section.title);
    }
  };

  const handleDelete = () => {
    if (section.items.length === 0 || window.confirm(`Delete "${section.title}" and all its items?`)) {
      deleteSection(section.id);
    }
  };

  return (
    <div ref={setNodeRef} style={sectionStyle}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {isOwnerEdit && (
          <button
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#999', background: 'none', border: 'none', padding: 0 }}
            aria-label="Drag section"
          >
            <GripVertical size={16} />
          </button>
        )}

        {editingTitle && isOwnerEdit ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(section.title); setEditingTitle(false); } }}
            style={{ fontSize: '1.1rem', fontWeight: 600, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px' }}
          />
        ) : (
          <h2
            style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, cursor: isOwnerEdit ? 'text' : 'default' }}
            onClick={() => isOwnerEdit && setEditingTitle(true)}
          >
            {section.title}
          </h2>
        )}

        {isOwnerEdit && (
          <button
            onClick={handleDelete}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
            aria-label="Delete section"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Item grid */}
      <SortableContext items={section.items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="bento-grid">
          {section.items.map(item => (
            <SortableGridItem key={item.id} item={item} sectionId={section.id} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default SortableSection;
