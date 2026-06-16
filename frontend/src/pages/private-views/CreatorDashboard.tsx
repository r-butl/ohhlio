import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Renderer from '@/components/creator-dashboard/grid/EditorGrid';
import EditorController from '@/components/creator-dashboard/EditorController';
import ProjectInfo from '@/components/creator-dashboard/ProjectInfo';
import { useEditorStore } from '@/context/EditorStore';
import { getUnifiedProjectById } from '@/services/projectService';
import { migrateLegacyItems } from '@/lib/migrateLegacyItems';

import { useUserContext } from '@/context/UserContext';
import SidebarLayout from "@/layouts/SidebarLayout";
import { useIsMobile } from '@/hooks/useMobile';

const CreatorDashboard: React.FC = () => {
  const viewState = useEditorStore(state => state.viewState);
  const exitEdit = useEditorStore(state => state.exitEdit);
  const viewerChanged = useEditorStore(state => state.viewerChanged);
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadProjectAssets = useEditorStore(state => state.loadProjectAssets);
  const storeProjectId = useEditorStore(state => state.projectId);

  const [loadingOnRefresh, setLoadingOnRefresh] = useState(false);
  // null = unknown (pending verification), true = allowed, false = denied
  const [canView, setCanView] = useState<boolean | null>(null);

  const hasNoItems = useEditorStore(
    state =>
      state.currentProject.items.sections.length === 0 ||
      state.currentProject.items.sections.every(s => s.items.length === 0)
  );

  const navigate = useNavigate();
  const { user, profileData } = useUserContext();
  const { username, projectId: urlProjectId } = useParams<{ username: string; projectId: string }>();
  const isHomeUser = user?.username === username;

  // On direct load, refresh, or auth state change — re-verify access to the project
  useEffect(() => {
    // No project in URL — this is the new-project page, always accessible
    if (!urlProjectId) {
      setCanView(true);
      return;
    }

    // Re-fetch whenever the URL project or the logged-in user changes so that
    // a logout clears stale store data and triggers a 403 redirect.
    const load = async () => {
      setLoadingOnRefresh(true);
      setCanView(null);
      try {
        const project = await getUnifiedProjectById(urlProjectId);
        if (project) {
          setItemsWithoutHistory(draft => {
            const migrated = migrateLegacyItems(project.items)
            draft.sections = migrated.sections
          });
          setProjectId(project.id);
          setProjectHeader({
            title: project.title,
            description: project.description,
            headerPhotoId: project.headerPhotoId,
          });
          await loadProjectAssets();
          setCanView(true);
        }
      } catch (err) {
        const status = (err as Error & { status?: number }).status;
        if (status === 403 || status === 404) {
          setCanView(false);
          navigate(`/${username}`);
          return;
        }
      } finally {
        setLoadingOnRefresh(false);
      }
    };

    load();
  }, [urlProjectId, user]);

  useEffect(() => {
    viewerChanged(isHomeUser);
  }, [isHomeUser, viewerChanged]);

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
    <SidebarLayout isOwner={isHomeUser} avatarUrl={profileData.profileImage}>
      <div className="project-page max-w-4xl mx-auto px-4">
        <EditorController isHomeUser={isHomeUser} page={'ProjectView'} />
        {canView === null || loadingOnRefresh ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading project...</div>
          </div>
        ) : canView ? (
          <>
            <ProjectInfo />
            {showEmpty ? (
              <div className="min-h-[200px] flex items-center justify-center text-gray-500">
                {viewState === 'OwnerEdit' ? 'Start by adding content.' : 'No content yet.'}
              </div>
            ) : (
              <Renderer />
            )}
          </>
        ) : null}
      </div>
    </SidebarLayout>
  );
};

export default CreatorDashboard;
