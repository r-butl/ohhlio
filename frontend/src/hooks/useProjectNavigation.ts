import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/context/EditorStore';
import { getProjectById } from '@/services/projectService';
import { migrateLegacyItems } from '@/lib/migrateLegacyItems';
import { toast } from 'sonner';

export const useProjectNavigation = () => {
  const navigate = useNavigate();
  
  // Editor store functions
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadProjectAssets = useEditorStore(state => state.loadProjectAssets);

  const navigateToProject = async (projectId: string, username: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Public path: do not preload; let CreatorDashboard handle public fetch
      navigate(`/${username}/project/${projectId}`);
      return;
    }

    try {
      toast.loading('Loading project...');
      // Private path: preload for faster transition
      const project = await getProjectById(projectId);
      if (project && project.items) {
        setItemsWithoutHistory(draft => { draft.sections = migrateLegacyItems(project.items).sections; });
        setProjectId(project.id);
        setProjectHeader({
          title: project.title,
          description: project.description,
          headerPhotoId: project.headerPhotoId
        });
        await loadProjectAssets();
      }
      toast.dismiss();
      navigate(`/${username}/project/${projectId}`);
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return { navigateToProject };
};
