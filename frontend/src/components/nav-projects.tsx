import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getProjects, deleteProject } from '@/services/projectService';
import { toast } from 'sonner';
import AddProjectButton from "@/components/buttons/AddProject";

interface Project {
  id: string;
  title: string;
}

export function NavProjects() {
  const { isMobile } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not fetch projects";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        toast.loading("Deleting project...");
        await deleteProject(projectId);
        await fetchProjects(); // Refetch projects to update the list
        toast.dismiss();
        toast.success("Project deleted successfully.");
        // Optional: Navigate away if the current project is deleted
        // navigate('/project'); 
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
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuButton asChild>
          <a href={"/"}>
            <House />
            <span>Home</span>
          </a>
        </SidebarMenuButton>
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton asChild>
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
        <SidebarMenuItem>
          <AddProjectButton />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
