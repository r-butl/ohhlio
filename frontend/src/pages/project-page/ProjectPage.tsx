import React, { useRef, useEffect } from 'react';
import Footer from '../../components/footer/Footer';
import Renderer from './components/PortfolioRenderer';
import SelectionBar from './components/selection-bar/SelectionBar';
import NavBar from '../../components/nav-bar/NavBar';
import { useEditorStore } from '../../context/EditorStore';

const ProjectPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const { mode } = useEditorStore();
  const isHomeUser = true;

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
          <Renderer/>
        </div>
        <Footer></Footer>
      </div>

  );
};

export default ProjectPage;
