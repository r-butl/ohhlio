import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Renderer from '@/components/creator-dashboard/grid/EditorGrid';
import EditorController from '@/components/creator-dashboard/EditorController';
import ProjectInfo from '@/components/creator-dashboard/ProjectInfo';
import { useEditorStore } from '@/context/EditorStore';

import { useUserContext } from '@/context/UserContext';
import SidebarLayout from "@/layouts/SidebarLayout";

import { useIsMobile } from '@/hooks/use-mobile';

const CreatorDashboard: React.FC = () => {
  const viewState = useEditorStore(state => state.viewState);
  const exitEdit = useEditorStore(state => state.exitEdit);

  const hasNoItems = useEditorStore(
    state => !state.currentProject.items || Object.keys(state.currentProject.items).length === 0
  );

  // Check if current user is the owner of this page
  const { user, profileData } = useUserContext();
  const { username } = useParams<{ username: string }>();
  const isHomeUser = user?.username === username;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState === 'OwnerEdit') {
        exitEdit();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewState, exitEdit]);

  return (
    <SidebarLayout showSidebar={viewState === 'OwnerEdit'} avatarUrl={profileData.profileImage}>
      <EditorController isHomeUser={isHomeUser} page={'ProfileOverview'} />

      <div className="project-page">
        <EditorController isHomeUser={isHomeUser} page={'ProjectView'} />
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
