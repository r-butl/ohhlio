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
import { Camera } from "lucide-react";

const ProfileOverview: React.FC = () => {
  const { user } = useAuth();
  const { projects, loadingProjects, profileData, fetchProfileData } = useUserContext();
  const { username } = useParams();
  const { navigateToProject } = useProjectNavigation();

  // State for editing profile
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const [tempDescription, setTempDescription] = useState(profileData.description);
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
      await updateUserProfile({ 
        description: tempDescription 
      });
      fetchProfileData();
      setIsEditingDescription(false);
      toast.success('Profile description updated successfully!');
    } catch (error) {
      console.error('Failed to update profile description:', error);
      toast.error('Failed to update profile description');
    }
  };

  // Handle description cancel
  const handleDescriptionCancel = () => {
    setTempDescription(profileData.description);
    setIsEditingDescription(false);
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
              <label className="cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <div className="relative w-20 h-20 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center cursor-pointer">
                  {profileData.profileImage ? (
                    <>
                      <img 
                        src={profileData.profileImage} 
                        alt={user.username} 
                        className="w-full h-full rounded-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <Camera className="w-8 h-8 text-gray-500" />
                  )}
                </div>
              </label>
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
                {profileData.description}
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
