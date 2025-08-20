// src/context/UserContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { getProjects } from "@/services/projectService";
import { getCurrentUser } from "@/services/userService";
import { getAssetById } from "@/services/assetService";
import { useAuth } from "./AuthContext";
import { profile } from "console";

type UserContextType = {
  user: { email: string; username: string; };
  profileData: { profileImage: string; description: string; };
  setUser: React.Dispatch<React.SetStateAction<{ email: string; username: string;}>>;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  loadingProjects: boolean;
  loadingProfileData: boolean;
  projectsError: any;
  fetchProjects: () => Promise<void>;
  fetchProfileData: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState({ email: "", username: ""});
  const [profileData, setProfileData] = useState( {  profileImage: "", description: "" })
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingProfileData, setLoadingProfileData] = useState(false);
  const [projectsError, setProjectsError] = useState<any>(null);

  const fetchProfileData = async () => {
    if (!authUser?.username || !isAuthenticated) return;
    setLoadingProfileData(true);
    try {
      const profileData = await getCurrentUser();

      const imageAsset = await getAssetById(profileData.profileImageId);

      console.log(profileData);
      setProfileData({
        profileImage: imageAsset,
        description: profileData.description
      });

    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoadingProfileData(false);
    }
  };

  const fetchProjects = async () => {
    // Use authUser directly to avoid race conditions
    if (!authUser?.username || !isAuthenticated) return;
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const projectData = await getProjects();
      setProjects(projectData);
    } catch (error) {
      setProjectsError(error);
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Sync user data when auth state changes
  useEffect(() => {
    if (authUser && isAuthenticated) {
      setUser({
        email: authUser.email,
        username: authUser.username || "",
      });
    } else {
      // Clear user data when logged out
      setUser({ email: "", username: "" });
      setProjects([]);
      setProjectsError(null);
    }
  }, [authUser, isAuthenticated]);

  // Fetch projects when auth state changes
  useEffect(() => {
    fetchProjects();
  }, [authUser, isAuthenticated]);

  return (
    <UserContext.Provider
      value={{
        user,
        profileData,
        setUser,
        projects,
        setProjects,
        loadingProjects,
        loadingProfileData,
        projectsError,
        fetchProjects,
        fetchProfileData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};


export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContext.Provider");
  }
  return context;
};
