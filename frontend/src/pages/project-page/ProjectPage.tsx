// frontend/src/pages/PortfolioPage/PortfolioPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import './ProjectPage.css';
import Renderer from '../../components/portfolio-renderer/Renderer';
import SelectionBar from '../../components/selection-bar/SelectionBar';

const ProjectPage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelectionBarOpen, setIsSelectionBarOpen] = useState(false);
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
  };

  const handleAddImage = (type: 'upload' | 'gallery') => {
    console.log('Adding image:', type);
    setIsSelectionBarOpen(false);
  };

  return (
    <div className="project-page">
      <header 
        ref={headerRef}
        className={`project-header ${isHeaderShadowed ? 'shadowed' : ''}`}
      >
        <h1>ProjectBuilder</h1>
        <div className="controls">
          <button
            className="mode-toggle"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Preview' : 'Edit'}
          </button>
        </div>
      </header>

      <div ref={rendererRef} className="renderer-container">
        <Renderer
          isDraggable={isEditMode}
          isResizable={isEditMode}
        />
      </div>

      {isEditMode && (
        <button 
          className="add-content-button"
          onClick={() => setIsSelectionBarOpen(true)}
        >
          Add Content
        </button>
      )}

      <SelectionBar
        isOpen={isSelectionBarOpen}
        onClose={() => setIsSelectionBarOpen(false)}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
      />
    </div>
  );
};

export default ProjectPage;