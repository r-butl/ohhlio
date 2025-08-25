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
  loadingProfileData: boolean;
  fetchProfileData: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState({ email: "", username: ""});
  const [profileData, setProfileData] = useState( {  profileImage: "", description: "" })
  const [loadingProfileData, setLoadingProfileData] = useState(false);

  const fetchProfileData = async () => {
    if (!authUser?.username || !isAuthenticated) return;
    setLoadingProfileData(true);
    try {
      const retrievedProfileData = await getCurrentUser();
      const imageAsset = await getAssetById(retrievedProfileData.profileImageId);

      console.log(retrievedProfileData);
      setProfileData({
        profileImage: imageAsset,
        description: retrievedProfileData.description
      });

    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoadingProfileData(false);
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
    }
  }, [authUser, isAuthenticated]);



  return (
    <UserContext.Provider
      value={{
        user,
        profileData,
        setUser,
        loadingProfileData,
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
