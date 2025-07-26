import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../components/footer/Footer';
import Renderer from '../components/PortfolioRenderer';
import EditorHeader from '../components/EditorHeader';
import { useEditorStore } from '../context/EditorStore';
import { getProjectById } from '@/services/projectService';
import { toast } from 'sonner';

import SidebarLayout from '../components/layouts/SidebarLayout';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const mode = useEditorStore(state => state.mode);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const loadAssetsForItems = useEditorStore(state => state.loadAssetsForItems);
  const isHomeUser = true;

  // Effect to load project data when the component mounts or projectId changes
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        try {
          toast.loading('Loading project...');
          const project = await getProjectById(projectId);
          if (project && project.items) {
            // Load project items
            setItemsWithoutHistory(() => project.items);
            setProjectId(project.id);
            
            // Load assets for all items after items are set
            await loadAssetsForItems();
          } else {
            console.log('Project or items do not exist, loading..')
          }
          toast.dismiss();
        } catch (error) {
          toast.dismiss();
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          toast.error(`Failed to load project: ${errorMessage}`);
          console.error(error);
        }
      } else {
        // If there's no projectId, ensure the store is cleared for a new project
        setItemsWithoutHistory(() => ({}));
        setProjectId(null);
      }
    };

    loadProject();
  }, [projectId, setItemsWithoutHistory, setProjectId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) =>
      e.key === 'Escape' && mode === 'edit';
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mode]);

  return (
    <SidebarLayout>
      <div className="project-page">
        <EditorHeader isHomeUser={isHomeUser} />
        <Renderer />
        <Footer />
      </div>
    </SidebarLayout>
  );
};

export default ProjectPage;
