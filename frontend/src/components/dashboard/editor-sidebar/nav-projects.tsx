import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  House,
  StickyNote,
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
import { useContext } from 'react';

export function NavProjects() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const userContext = useContext(UserContext);

  if (!userContext) {
    throw new Error('NavProjects must be used within a UserProvider');
  }

  const { projects, fetchProjects } = userContext;

  // Determine if we're on the homepage
  const isHomeSelected = location.pathname === '/project' || location.pathname === '/';
  
  // Determine if a specific project is selected
  const isProjectSelected = (projectId: string) => {
    return location.pathname === `/project/${projectId}`;
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        toast.loading("Deleting project...");
        await deleteProject(projectId);
        await fetchProjects(); 
        toast.dismiss();
        toast.success("Project deleted successfully.");

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
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>My Projects</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            asChild 
            className={isHomeSelected ? "bg-accent text-accent-foreground" : ""}
          >
            <a href={"/"}>
              <House />
              <span>Home</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {projects.map((project: any) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton 
              asChild
              className={isProjectSelected(project.id) ? "bg-accent text-accent-foreground" : ""}
            >
              <a href={`/project/${project.id}`}>
                <StickyNote className="h-4 w-2" />
                <span>{project.title}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => navigate(`/project/${project.id}`)}>
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
