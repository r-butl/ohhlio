import React from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserContext } from '@/context/UserContext';
import SidebarLayout from '@/layouts/SidebarLayout';
import EditorController from '@/components/creator-dashboard/EditorController';

const UserLayout: React.FC = () => {
  const { user } = useAuth();
  const { profileData } = useUserContext();
  const { username } = useParams<{ username: string }>();
  const location = useLocation();

  const isOwner = user?.username === username;
  const page = location.pathname.includes('/project') ? 'ProjectView' as const : 'ProfileOverview' as const;

  return (
    <SidebarLayout isOwner={isOwner} avatarUrl={profileData?.profileImage}>
      <EditorController isHomeUser={isOwner} page={page} />
      <Outlet />
    </SidebarLayout>
  );
};

export default UserLayout;
