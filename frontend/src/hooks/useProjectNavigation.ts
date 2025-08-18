import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/context/EditorStore';
import { getProjectById } from '@/services/projectService';
import { toast } from 'sonner';

export const useProjectNavigation = () => {
  const navigate = useNavigate();
  
  // Editor store functions
  const setItemsWithoutHistory = useEditorStore(state => state.setItemsWithoutHistory);
  const setProjectId = useEditorStore(state => state.setProjectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  const loadAssetsForItems = useEditorStore(state => state.loadAssetsForItems);

  const navigateToProject = async (projectId: string, username: string) => {
    try {
      toast.loading('Loading project...');
      
      // Load project data
      const project = await getProjectById(projectId);
      if (project && project.items) {
        // Set project data in store
        setItemsWithoutHistory(() => project.items);
        setProjectId(project.id);
        setProjectHeader({
          title: project.title,
          description: project.description,
          headerPhotoId: project.headerPhotoId
        });
        
        // Load assets before navigating
        await loadAssetsForItems();
      }
      
      toast.dismiss();
      
      // Navigate after everything is loaded
      navigate(`/${username}/project/${projectId}`);
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Failed to load project";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return { navigateToProject };
};
