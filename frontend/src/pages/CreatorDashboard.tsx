import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Renderer from '@/components/creator-dashboard/grid/EditorGrid';
import EditorHeader from '@/components/creator-dashboard/EditorController';
import ProjectInfo from '@/components/creator-dashboard/ProjectInfo';
import { useEditorStore } from '@/context/EditorStore';
import { getProjectById } from '@/services/projectService';
import { toast } from 'sonner';
import { useUserContext } from '@/context/UserContext';

import SidebarLayout from '../layouts/SidebarLayout';

const CreatorDashboard: React.FC = () => {
  const { username, projectId } = useParams<{ username:string, projectId: string }>();
  const mode = useEditorStore(state => state.mode);
  const isLoadingAssets = useEditorStore(state => state.isLoadingAssets);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadProjectAssets = useEditorStore(state => state.loadProjectAssets);
  
  // Check if current user is the owner of this page
  const { user } = useUserContext();
  const isHomeUser = user.username === username;
  console.log(`${user.username} ${username}`)

  // Effect to load project data when the component mounts or projectId changes
  useEffect(() => {
    const loadProject = async () => {
      // Wait for user data to be loaded before checking authorization
      if (!user.username) {
        console.log('User data not loaded yet, waiting...');
        return;
      }

      // Check if user is authorized to access this page
      if (!isHomeUser) {
        toast.error('You are not authorized to access this page');
        return;
      }

      // Only load project if it's not already loaded (e.g., direct URL access)
      const currentProjectId = useEditorStore.getState().projectId;
      if (projectId && currentProjectId !== projectId) {
        try {
          toast.loading('Loading project...');
          const project = await getProjectById(projectId);
          if (project && project.items) {
            // Load project items
            setItemsWithoutHistory(() => project.items);
            setProjectId(project.id);
            
            // Load project header data
            setProjectHeader({
              title: project.title,
              description: project.description,
              headerPhotoId: project.headerPhotoId
            });
            
            // Load assets for all items after items are set
            await loadProjectAssets();
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
      } else if (!projectId) {
        // If there's no projectId, ensure the store is cleared for a new project
        setItemsWithoutHistory(() => ({}));
        setProjectId(null);
      }
    };

    loadProject();
  }, [projectId, setProjectId, isHomeUser, user.username]);

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
        <ProjectInfo />
        <Renderer />
      </div>
    </SidebarLayout>
  );
};

export default CreatorDashboard;
