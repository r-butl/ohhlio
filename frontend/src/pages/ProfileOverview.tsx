import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/layouts/SidebarLayout";
import { useParams } from "react-router-dom";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";
import { updateUserProfile, uploadProfileImage } from "@/services/userService";
import { toast } from "sonner";

import { getAssetById } from "@/services/assetService";

const ProfileOverview: React.FC = () => {
  const { user } = useAuth();
  const { projects, loadingProjects, profileData, fetchProfileData } = useUserContext();
  const { username } = useParams();
  const { navigateToProject } = useProjectNavigation();

  // State for editing profile
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [profileDescription, setProfileDescription] = useState(
    "Welcome to my profile! I'm a creator who loves building amazing projects."
  );
  const [tempDescription, setTempDescription] = useState(profileDescription);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load user profile on component mount
  useEffect(() => {
    if (user) {
     fetchProfileData();
    }
  }, [user]);


  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploadingPhoto(true);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be smaller than 5MB');
          return;
        }

        // Upload the profile image
        const uploadedAsset = await uploadProfileImage(file);
        console.log(uploadedAsset);

        // Update the users image 
        const updatedProfile = await updateUserProfile({
          profileImageId: uploadedAsset.id,
          description: profileData.description
        })

        console.log(updatedProfile);
        
        // Reload user profile to get updated data
        await fetchProfileData();
        
        toast.success('Profile photo updated successfully!');
        setIsEditingPhoto(false);
      } catch (error) {
        console.error('Failed to upload profile image:', error);
        toast.error('Failed to upload profile image');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  // Handle description save
  const handleDescriptionSave = async () => {
    try {
      await updateUserProfile({ description: tempDescription });
      setProfileDescription(tempDescription);
      setIsEditingDescription(false);
      toast.success('Profile description updated successfully!');
    } catch (error) {
      console.error('Failed to update profile description:', error);
      toast.error('Failed to update profile description');
    }
  };

  // Handle description cancel
  const handleDescriptionCancel = () => {
    setTempDescription(profileDescription);
    setIsEditingDescription(false);
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (userProfile?.profileImageId) {
      return `/api/assets/${userProfile.profileImageId}`;
    }
    return "/default-avatar.png";
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-20 max-w-4xl mt-8">
        {/* Header with Avatar */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            <div className="relative">
              <Avatar 
                className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsEditingPhoto(true)}
              >
                <AvatarImage src={profileData.profileImage} alt={user.username} />
                <AvatarFallback className="text-lg">
                  {user.username ? user.username.charAt(0).toUpperCase() : "no-name"}
                </AvatarFallback>
              </Avatar>
              
              {/* Photo upload overlay */}
              {isEditingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="text-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      <div className="text-white text-xs">
                        {uploadingPhoto ? 'Uploading...' : 'Click to upload'}
                      </div>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-gray-300 mt-1"
                      onClick={() => setIsEditingPhoto(false)}
                      disabled={uploadingPhoto}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold">
              {user.username || "no-name"}
            </h1>
          </div>
          
          {/* Editable Description */}
          <div className="mt-4">
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="Enter your profile description..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDescriptionSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDescriptionCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p 
                className="text-muted-foreground text-lg cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                onClick={() => setIsEditingDescription(true)}
              >
                {profileDescription}
              </p>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects yet. Start creating!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => navigateToProject(project.id, username || '')}
                >
                  {/* Header Photo */}
                  {project.headerPhotoId && (
                    <div className="w-full h-32 bg-muted relative">
                      <img 
                        src={`/api/assets/${project.headerPhotoId}`}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide the image if it fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfileOverview;
