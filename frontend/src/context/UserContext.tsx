// src/context/UserContext.tsx
import React, { createContext, useState, useEffect } from "react";
import { getProjects } from "@/services/projectService";
import { useAuth } from "./AuthContext";

type UserContextType = {
  user: { email: string; username: string; };
  setUser: React.Dispatch<React.SetStateAction<{ email: string; username: string;}>>;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  loadingProjects: boolean;
  projectsError: any;
  fetchProjects: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState({ email: "", username: ""});
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState<any>(null);

  const fetchProjects = async () => {
    if (!user.username) return;
    setLoadingProjects(true);
    setProjectsError(null);
    try {
      const projectData = await getProjects();
      setProjects(projectData);
    } catch (error) {
      setProjectsError(error);
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

  // Fetch projects when user changes
  useEffect(() => {
    fetchProjects();
  }, [user.username]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        projects,
        setProjects,
        loadingProjects,
        projectsError,
        fetchProjects,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
