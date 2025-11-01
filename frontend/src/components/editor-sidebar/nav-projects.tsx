import { useNavigate, useLocation } from 'react-router-dom';
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  House,
  StickyNote,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { deleteProject } from '@/services/projectService';
import { toast } from 'sonner';
import { UserContext } from "@/context/UserContext";
import { useContext, useEffect } from 'react';
import { useProjectNavigation } from '@/hooks/useProjectNavigation';
import { useEditorStore } from '@/context/EditorStore';

export function NavProjects() {
  const { isMobile } = useSidebar();
  const location = useLocation();
  const userContext = useContext(UserContext);
  const navigate = useNavigate();

  if (!userContext) {
    throw new Error('NavProjects must be used within a UserProvider');
  }

  const { projects, fetchProjects } = useEditorStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    fetchProjects();
  }, []);

  
  // Use the custom hook for project navigation
  const { navigateToProject } = useProjectNavigation();

  // Get username from user context
  const { user } = userContext;
  
  // Determine if we're on the profile page
  const isProfileSelected = location.pathname === `/${user.username}`;
  
  // Determine if we're on the homepage
  const isHomeSelected = location.pathname === `/${user.username}/project` || location.pathname === '/';
  
  // Determine if a specific project is selected
  const isProjectSelected = (projectId: string) => {
    return location.pathname === `/${user.username}/project/${projectId}`;
  };



  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        toast.loading("Deleting project...");
        await deleteProject(projectId);
        await fetchProjects(); 
        toast.dismiss();
        toast.success("Project deleted successfully.");
        navigate(`/${user.username}`)

        // Optional: Navigate away if the current project is deleted
      } catch (error) {
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : "Failed to delete project";
        toast.error(errorMessage);
        console.error(error);
      }
    }
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>My Portfolio</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => navigate(`/${user.username}`)}
              className={isProfileSelected ? "selected" : ""}
            >
              <House />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {projects.map((project: any) => {
            const selected = isProjectSelected(project.id);
            return (
              <SidebarMenuItem key={project.id} className="group">
              <SidebarMenuButton 
                onClick={() => navigateToProject(project.id, user.username)}
                  className={selected ? "selected" : ""}
              >
                <StickyNote className="h-4 w-2" />
                <span>{project.title}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                      <MoreHorizontal className={selected ? 'group-hover:text-white' : undefined} />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onClick={() => navigateToProject(project.id, user.username)}>
                    <Folder className="text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(project.id)}>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    
    </>
  );
}
