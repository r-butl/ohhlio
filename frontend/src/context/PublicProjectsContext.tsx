// src/context/PublicProjectsContext.tsx
import React, { createContext, useState, useEffect } from "react";
import { getPublicProjects, getPublicProjectById } from "@/services/projectService";

type PublicProjectsContextType = {
  publicProjects: any[];
  setPublicProjects: React.Dispatch<React.SetStateAction<any[]>>;
  loadingPublicProjects: boolean;
  publicProjectsError: any;
  fetchPublicProjects: () => Promise<void>;
  getPublicProject: (id: string) => Promise<any>;
};

export const PublicProjectsContext = createContext<PublicProjectsContextType | null>(null);

export const PublicProjectsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [loadingPublicProjects, setLoadingPublicProjects] = useState(false);
  const [publicProjectsError, setPublicProjectsError] = useState<any>(null);

  const fetchPublicProjects = async () => {
    setLoadingPublicProjects(true);
    setPublicProjectsError(null);
    try {
      const projectData = await getPublicProjects();
      setPublicProjects(projectData);
    } catch (error) {
      setPublicProjectsError(error);
    } finally {
      setLoadingPublicProjects(false);
    }
  };

  const getPublicProject = async (id: string) => {
    try {
      return await getPublicProjectById(id);
    } catch (error) {
      setPublicProjectsError(error);
      throw error;
    }
  };

  // Fetch public projects on mount
  useEffect(() => {
    fetchPublicProjects();
  }, []);

  return (
    <PublicProjectsContext.Provider
      value={{
        publicProjects,
        setPublicProjects,
        loadingPublicProjects,
        publicProjectsError,
        fetchPublicProjects,
        getPublicProject,
      }}
    >
      {children}
    </PublicProjectsContext.Provider>
  );
}; 