// frontend/src/pages/PortfolioPage/PortfolioPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import './ProjectPage.css';
import Renderer from '../../components/portfolio-renderer/Renderer';
import SelectionBar from '../../components/selection-bar/SelectionBar';
import Header from '../../components/header/Header';
import { useFormState } from 'react-dom';

const ProjectPage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelectionBarOpen, setIsSelectionBarOpen] = useState(false);
  const [contentSchema, setContentSchema] = useState<ContentItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isHomeUser, setIsHomeUser] = useState(true);

  const [isHeaderShadowed, setIsHeaderShadowed] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current || !rendererRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderShadowed(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px'
      }
    );

    observer.observe(rendererRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSelectionBarOpen) {
        setIsSelectionBarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSelectionBarOpen]);

  const handleAddText = () => {
    console.log('Adding text block');
    setIsSelectionBarOpen(false);
    setContentSchema(prev => [...prev, { type: 'text' }]);
  };

  const handleAddImage = (type: 'upload' | 'gallery') => {
    console.log('Adding image:', type);
    setIsSelectionBarOpen(false);
  };

  const handleEditingStateChange = (isEditing: boolean) => {
    console.log('ProjectPage editing state changed:', isEditing);
    setIsEditing(isEditing);
  }

  return (
    <div className="project-page">
      <header 
        ref={headerRef}
        className={`project-header ${isHeaderShadowed ? 'shadowed' : ''}`}
      ></header>

      <Header
          isEditMode={isEditMode}
          isEditing={isEditing}
          setIsEditMode={setIsEditMode}
          isHomeUser={isHomeUser}
      />

      <SelectionBar
          isOpen={isEditMode}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
      />

      <div ref={rendererRef} className={`renderer-container ${isEditMode ? 'shifted' : ''}`}
      >
        <Renderer
          isEditMode={isEditMode}
          isEditing={isEditing}
          contentSchema={contentSchema}
          onContentChange={setContentSchema}
          onEditingStateChange={handleEditingStateChange}
        />
      </div>


    </div>
  );
};

export default ProjectPage;