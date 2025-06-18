import React, { useRef, useEffect } from 'react';
import './ProjectPage.css';
import Renderer from '../../components/portfolio-renderer/PortfolioRenderer';
import SelectionBar from '../../components/selection-bar/SelectionBar';
import NavBar from '../../components/nav-bar/NavBar';
import { useEditorStore } from '../../events/EditorStore';

const ProjectPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const { mode, items } = useEditorStore();

  const isHomeUser = true;

  // Close selection bar on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) =>
      e.key === 'Escape' && mode === 'edit';
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mode]);

  return (
    <div className="project-page">
      <header
        ref={headerRef}
        className={`project-header`}
      ></header>

      <NavBar isHomeUser={isHomeUser} />

      <SelectionBar/>

      <div
        ref={rendererRef}
        className={`renderer-container ${mode === 'edit' ? 'shifted' : ''}`}
      >
        <Renderer
          items={items}
          isHomeUser={isHomeUser}
        />
      </div>
    </div>
  );
};

export default ProjectPage;
