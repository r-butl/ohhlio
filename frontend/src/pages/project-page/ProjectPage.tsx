import React, { useRef, useEffect } from 'react';
import Footer from '../../components/footer/Footer';
import Renderer from './components/PortfolioRenderer';
import EditorHeader from '../../components/editor-header/EditorHeader';
import { useEditorStore } from '../../context/EditorStore';

import SidebarLayout from '../../components/layouts/SidebarLayout';

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
    <SidebarLayout>
      <div className="project-page">
        <header
          ref={headerRef}
          className={`project-header`}
        ></header>

        <EditorHeader isHomeUser={isHomeUser} />

          <div
            ref={rendererRef}
            className={`renderer-container ${mode === 'edit' ? 'shifted' : ''}`}
          >
            <Renderer/>
          </div>
        <Footer></Footer>
      </div>

    </SidebarLayout>


  );
};

export default ProjectPage;
