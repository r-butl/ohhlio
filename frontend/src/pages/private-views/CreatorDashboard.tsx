import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Renderer from '@/components/creator-dashboard/grid/EditorGrid';
import EditorController from '@/components/creator-dashboard/EditorController';
import ProjectInfo from '@/components/creator-dashboard/ProjectInfo';
import { useEditorStore } from '@/context/EditorStore';
import { getUnifiedProjectById } from '@/services/projectService';

import { useUserContext } from '@/context/UserContext';
import SidebarLayout from "@/layouts/SidebarLayout";
import { useIsMobile } from '@/hooks/use-mobile';

const CreatorDashboard: React.FC = () => {
  const viewState = useEditorStore(state => state.viewState);
  const exitEdit = useEditorStore(state => state.exitEdit);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadProjectAssets = useEditorStore(state => state.loadProjectAssets);
  const storeProjectId = useEditorStore(state => state.projectId);

  const [loadingOnRefresh, setLoadingOnRefresh] = useState(false);

  const hasNoItems = useEditorStore(
    state => !state.currentProject.items || Object.keys(state.currentProject.items).length === 0
  );

  const { user, profileData } = useUserContext();
  const { username, projectId: urlProjectId } = useParams<{ username: string; projectId: string }>();
  const isHomeUser = user?.username === username;

  // On direct load or refresh, the store is empty — fetch the project from the URL param
  useEffect(() => {
    if (!urlProjectId || storeProjectId === urlProjectId) return;

    const load = async () => {
      setLoadingOnRefresh(true);
      try {
        const project = await getUnifiedProjectById(urlProjectId);
        if (project) {
          setItemsWithoutHistory(() => project.items ?? {});
          setProjectId(project.id);
          setProjectHeader({
            title: project.title,
            description: project.description,
            headerPhotoId: project.headerPhotoId,
          });
          await loadProjectAssets();
        }
      } catch {
        // leave hasNoItems true — the empty state will render
      } finally {
        setLoadingOnRefresh(false);
      }
    };

    load();
  }, [urlProjectId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState === 'OwnerEdit') {
        exitEdit();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewState, exitEdit]);

  const showEmpty = hasNoItems && !loadingOnRefresh;

  return (
    <SidebarLayout showSidebar={viewState === 'OwnerEdit'} avatarUrl={profileData.profileImage}>
      <div className="project-page">
        <EditorController isHomeUser={isHomeUser} page={'ProjectView'} />
        <ProjectInfo />
        {loadingOnRefresh ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading project...</div>
          </div>
        ) : showEmpty ? (
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
