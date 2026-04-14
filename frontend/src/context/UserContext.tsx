// src/context/UserContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser } from "@/services/userService";
import { getAssetById } from "@/services/assetService";
import { useAuth } from "./AuthContext";


import { UserContextInterface } from "@/interfaces/UserAuthInterfaces";

export const UserContext = createContext<UserContextInterface | null>(null);

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState({ email: "", username: ""});
  const [profileData, setProfileData] = useState( () => {
    // Hydrate from cache to show avatar immediately
    try {
      const cachedAvatar = localStorage.getItem('avatarUrl') || "";
      const cachedDescription = localStorage.getItem('profileDescription') || "";
      return { profileImage: cachedAvatar, description: cachedDescription };
    } catch {
      return { profileImage: "", description: "" };
    }
  })
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

      // Cache for fast subsequent loads
      try {
        localStorage.setItem('avatarUrl', imageAsset || "");
        localStorage.setItem('profileDescription', retrievedProfileData.description || "");
      } catch {}

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
      // Fetch and cache profile details on login
      fetchProfileData();
    } else {
      // Clear user data when logged out
      setUser({ email: "", username: "" });
      setProfileData({ profileImage: "", description: "" });
      try {
        localStorage.removeItem('avatarUrl');
        localStorage.removeItem('profileDescription');
      } catch {}
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
