import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '@/context/EditorStore';
import { ListTree } from "lucide-react";
import { useProjectNavigation } from '@/hooks/useProjectNavigation';
import { getUnifiedProfile } from '@/services/userService';

type NavMenuButtonProps = {
  alignLeft?: boolean;
};

const NavMenuButton: React.FC<NavMenuButtonProps> = ({ alignLeft = true }) => {
  const navigate = useNavigate();
  const { username = '' } = useParams<{ username: string }>();
  const isAuthed = typeof window !== 'undefined' && Boolean(localStorage.getItem('token'));
  const projects = useEditorStore(state => state.projects);
  const loadingProjects = useEditorStore(state => state.loadingProjects);
  const fetchProjects = useEditorStore(state => state.fetchProjects);
  const { navigateToProject } = useProjectNavigation();
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthed) {
      if (!projects || projects.length === 0) {
        fetchProjects();
      }
      return;
    }
    // Public: fetch projects via unified profile for the viewed username
    if (username) {
      setLoadingPublic(true);
      getUnifiedProfile(username)
        .then((data) => setPublicProjects(data?.projects || []))
        .catch(() => setPublicProjects([]))
        .finally(() => setLoadingPublic(false));
    }
  }, [projects?.length, username, isAuthed]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Navigation menu">
          <ListTree />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignLeft ? 'start' : 'end'} className="w-56">
        <DropdownMenuLabel>Navigate</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/${username}`)}>
          Profile homepage
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        {(isAuthed ? loadingProjects : loadingPublic) && (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        )}
        {!(isAuthed ? loadingProjects : loadingPublic) &&
         (!(isAuthed ? projects : publicProjects) || (isAuthed ? projects.length === 0 : publicProjects.length === 0)) && (
          <DropdownMenuItem disabled>No projects</DropdownMenuItem>
        )}
        {!(isAuthed ? loadingProjects : loadingPublic) &&
          (isAuthed ? projects : publicProjects)?.map((project: any) => (
            <DropdownMenuItem key={project.id} onClick={() => navigateToProject(project.id, username)}>
              {project.title || 'Untitled project'}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavMenuButton;


