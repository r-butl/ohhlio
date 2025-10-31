import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Renderer from '@/components/creator-dashboard/grid/EditorGrid';
import EditorController from '@/components/creator-dashboard/EditorController';
import ProjectInfo from '@/components/creator-dashboard/ProjectInfo';
import { useEditorStore } from '@/context/EditorStore';
import { getProjectById, getPublicProjectById } from '@/services/projectService';
import { toast } from 'sonner';
import { getPublicAssetById } from '@/services/assetService';
import { useUserContext } from '@/context/UserContext';

import SidebarLayout from '../layouts/SidebarLayout';
import ProjectLoader from '@/components/ui/ProjectLoader';
import ProjectError from '@/components/ui/ProjectError';

const CreatorDashboard: React.FC = () => {
  const { username, projectId } = useParams<{ username:string, projectId: string }>();
  const viewState = useEditorStore(state => state.viewState);
  const viewerChanged = useEditorStore(state => state.viewerChanged);
  const isLoadingAssets = useEditorStore(state => state.isLoadingAssets);
  const loadingProject = useEditorStore(state => state.loadingProject);
  const projectError = useEditorStore(state => state.projectError);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadProjectAssets = useEditorStore(state => state.loadProjectAssets);
  const setLoadingProject = useEditorStore(state => state.setLoadingProject);
  const setProjectError = useEditorStore(state => state.setProjectError);
  
  // Check if current user is the owner of this page
  const { user } = useUserContext();
  const isHomeUser = user.username === username;
  console.log(`${user.username} ${username}`)

  // React to viewer changes (auth/route) and choose fetch path
  useEffect(() => {
    viewerChanged(Boolean(user.username) && isHomeUser);
  }, [user.username, isHomeUser, viewerChanged]);

  // Effect to load project data when the component mounts or projectId changes
  useEffect(() => {
    const loadProject = async () => {
      // Guard against duplicate fetches
      if (useEditorStore.getState().loadingProject) {
        console.log('Project load already in progress; skipping.');
        return;
      }
      // Only load project if it's not already loaded (e.g., direct URL access)
      const currentProjectId = useEditorStore.getState().projectId;
      if (projectId && currentProjectId !== projectId) {
        try {
          setProjectError(null);
          setLoadingProject(true);
          const project = isHomeUser
            ? await getProjectById(projectId)
            : await getPublicProjectById(projectId);
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
            if (isHomeUser) {
              await loadProjectAssets();
            } else {
              // Public asset loading
              const items = project.items || {};
              for (const itemId in items) {
                const item = items[itemId];
                if (!item?.props?.assetId) continue;
                try {
                  const url = await getPublicAssetById(item.props.assetId);
                  setItemsWithoutHistory(draft => {
                    if (item.type === 'image') {
                      draft[itemId].props.originalImage = url;
                    } else {
                      draft[itemId].props.assetUrl = url;
                    }
                  });
                } catch (e) {
                  console.error('Failed to load public asset', e);
                }
              }
            }
          } else {
            console.log('Project or items do not exist, loading..')
          }
          setLoadingProject(false);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          console.error('Failed to load project', errorMessage);
          setProjectError(errorMessage);
          setLoadingProject(false);
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
      e.key === 'Escape' && viewState === 'OwnerEdit';
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewState]);

  // Unified loader and error render
  if (loadingProject) {
    return (
      <SidebarLayout showSidebar={viewState === 'OwnerEdit'}>
        <ProjectLoader />
      </SidebarLayout>
    );
  }

  if (projectError) {
    return (
      <SidebarLayout showSidebar={viewState === 'OwnerEdit'}>
        <ProjectError message={projectError} />
      </SidebarLayout>
    );
  }

  const items = useEditorStore(state => state.currentProject.items);
  const hasNoItems = !items || Object.keys(items).length === 0;

  return (
    <SidebarLayout showSidebar={viewState === 'OwnerEdit'}>
      <div className="project-page">
        <EditorController isHomeUser={isHomeUser} />
        <ProjectInfo />
        {hasNoItems ? (
          <div className="min-h-[200px] flex items-center justify-center text-gray-500">
            {viewState === 'OwnerEdit' ? 'Start by adding content.' : 'No content yet.'}
          </div>
        ) : (
          <Renderer />
        )}
      </div>
    </SidebarLayout>
  );
};

export default CreatorDashboard;
