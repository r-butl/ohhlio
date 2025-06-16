import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ProjectPage.css';
import Renderer from '../../components/portfolio-renderer/Renderer';
import SelectionBar from '../../components/selection-bar/SelectionBar';
import NavBar from '../../components/nav-bar/NavBar';
import { ContentItem } from '../../components/types/ContentItem';

const ProjectPage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contentSchema, setContentSchema] = useState<ContentItem[]>([]);

  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HTMLDivElement>(null);

  // Close selection bar on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) =>
      e.key === 'Escape' && isEditMode;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Utility to create layout
  const generateLayout = (index: number) => {
    // Find the highest y position in the current grid
    const maxY = contentSchema.reduce((max, item) => Math.max(max, item.layout.y + item.layout.h), 0);
    
    return {
      x: 0,
      y: maxY, 
      w: 3,
      h: 3,
      i: String(Date.now())
    };
  };

  const addItem = useCallback((type: 'text' | 'image') => {
    const id = String(Date.now());
    const newItem: ContentItem = {
      id,
      type,
      content: '',
      layout: generateLayout(contentSchema.length)
    };
    setContentSchema(prev => [...prev, newItem]);
  }, [contentSchema.length]);

  return (
    <div className="project-page">
      <header
        ref={headerRef}
        className={`project-header`}
      ></header>

      <NavBar
        isEditMode={isEditMode}
        isEditing={isEditing}
        setIsEditMode={setIsEditMode}
        isHomeUser={true}
      />

      <SelectionBar
        isOpen={isEditMode}
        onAddText={() => addItem('text')}
        onAddImage={() => addItem('image')}
      />

      <div
        ref={rendererRef}
        className={`renderer-container ${isEditMode ? 'shifted' : ''}`}
      >
        <Renderer
          isEditMode={isEditMode}
          isEditing={isEditing}
          contentSchema={contentSchema}
          onContentChange={setContentSchema}
          onEditingStateChange={setIsEditing}
        />
      </div>
    </div>
  );
};

export default ProjectPage;
