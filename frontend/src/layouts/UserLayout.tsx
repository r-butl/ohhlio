import React from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserContext } from '@/context/UserContext';
import { useEditorStore } from '@/context/EditorStore';
import SidebarLayout from '@/layouts/SidebarLayout';
import EditorController from '@/components/creator-dashboard/EditorController';
import { cn } from '@/lib/utils';

const UserLayout: React.FC = () => {
  const { user } = useAuth();
  const { profileData } = useUserContext();
  const { username } = useParams<{ username: string }>();
  const location = useLocation();

  const isOwner = user?.username === username;
  const page = location.pathname.includes('/project') ? 'ProjectView' as const : 'ProfileOverview' as const;
  const isMobileView = useEditorStore(state => state.isMobileView);

  return (
    <SidebarLayout isOwner={isOwner} avatarUrl={profileData?.profileImage}>
      <div className="sticky top-0 z-10 bg-background">
        <EditorController isHomeUser={isOwner} page={page} />
      </div>
      <div className={cn(isMobileView && "max-w-[390px] mx-auto w-full")}>
        <Outlet />
      </div>
    </SidebarLayout>
  );
};

export default UserLayout;
