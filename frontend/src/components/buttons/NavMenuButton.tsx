import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useParams, useNavigate } from 'react-router-dom';
import { AlignJustify, Search, User, LogIn, StickyNote } from "lucide-react";
import { useProjectNavigation } from '@/hooks/useProjectNavigation';
import { getUnifiedProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { useUserContext } from '@/context/UserContext';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

type NavMenuButtonProps = {
  alignLeft?: boolean;
};

const NavMenuButton: React.FC<NavMenuButtonProps> = ({ alignLeft = true }) => {
  const navigate = useNavigate();
  const { username = '' } = useParams<{ username: string }>();
  const { user: authUser, isAuthenticated } = useAuth();
  const { profileData } = useUserContext();
  const { navigateToProject } = useProjectNavigation();
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState<boolean>(false);

  useEffect(() => {
    // Always fetch projects for the viewed username, regardless of authentication
    if (username) {
      setLoadingPublic(true);
      getUnifiedProfile(username)
        .then((data) => setPublicProjects(data?.projects || []))
        .catch(() => setPublicProjects([]))
        .finally(() => setLoadingPublic(false));
    }
  }, [username]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" aria-label="Navigation menu">
          <AlignJustify/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={alignLeft ? 'start' : 'end'} className="w-56">
        {/* Item 1: User profile or Login */}
        {isAuthenticated && authUser ? (
          <DropdownMenuItem onClick={() => navigate(`/${authUser.username}`)}>
            <ProfileAvatar 
              src={profileData.profileImage} 
              alt={authUser.username || 'Profile'} 
              size="sm" 
              editable={false}
              className="mr-2"
            />
            <span>My Profile</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => navigate('/login')}>
            <LogIn className="mr-2" />
            <span>Login to Ohhlio</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Item 2: Search (not implemented yet) */}
        <DropdownMenuItem onClick={() => {/* TODO: implement search */}} disabled>
          <Search className="mr-2" />
          <span>Search</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>{username}'s Portfolio</DropdownMenuLabel>
        {/* Item 3: Current user's profile home */}
        <DropdownMenuItem onClick={() => navigate(`/${username}`)}>
          <User className="mr-2" />
          <span>Profile Overview</span>
        </DropdownMenuItem>

        {/* Following items: Projects */}
        {loadingPublic && (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        )}
        {!loadingPublic &&
         (!publicProjects || publicProjects.length === 0) && (
          <DropdownMenuItem disabled>No projects</DropdownMenuItem>
        )}
        {!loadingPublic &&
          publicProjects?.map((project: any) => (
            <DropdownMenuItem key={project.id} onClick={() => navigateToProject(project.id, username)}>
              <StickyNote className="mr-2 h-4 w-2" />
              <span>{project.title || 'Untitled project'}</span>
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavMenuButton;


