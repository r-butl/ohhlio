import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";

import { useParams } from "react-router-dom";
import { updateUserProfile, uploadProfileImage, getUnifiedProfile } from "@/services/userService";
import { toast } from "sonner";
import EditableDescription from "@/components/ui/editable-description";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import ProjectCard from "@/components/profile-overview/ProjectCard"
import { useEditorStore } from "@/context/EditorStore";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarLayout from "@/layouts/SidebarLayout";
import EditorController from "@/components/creator-dashboard/EditorController";
import { compressImage } from "@/utils/compressImage";
// unified endpoint includes projects; no separate import

const ProfileOverview: React.FC = () => {
  const { user } = useAuth();
  const { profileData, fetchProfileData } = useUserContext();

  const { username } = useParams();
  const isOwner = user?.username === username;
  const viewState = useEditorStore(state => state.viewState);

  const isOwnerEdit = viewState === 'OwnerEdit';
  const viewerChanged = useEditorStore(state => state.viewerChanged);
  const isMobile = useIsMobile();

  // Local state for public view data
  const [publicProfile, setPublicProfile] = useState<{ profileImage?: string; description?: string; username?: string }>({});
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState<boolean>(false);

  // Load profile + projects from unified endpoint (auth-optional)
  useEffect(() => {
    const load = async () => {
      if (!username) return;
      setPublicLoading(true);
      try {
        const unified = await getUnifiedProfile(username as string);
        setPublicProfile({
          profileImage: unified?.profile?.profileImageUrl || "",
          description: unified?.profile?.description || "",
          username: unified?.profile?.username || (username as string),
        });
        setPublicProjects(unified?.projects || []);
        // If canEdit, the rest of the owner-specific flows remain as-is
      } catch (e) {
        console.error(e);
      } finally {
        setPublicLoading(false);
      }
    };
    load();
  }, [user, isOwner, username]);

  // Keep editor view state in sync with ownership for top bar controls; force public on mobile;
  // default to OwnerEdit for owners and restore last view on refresh
  useEffect(() => {
    if (isMobile) {
      viewerChanged(false);
    } else {
      const isOwnerUser = Boolean(user?.username) && isOwner;
      viewerChanged(isOwnerUser);
      if (isOwnerUser) {
        try {
          const saved = localStorage.getItem('viewState');
          if (saved === 'OwnerPreview') {
            useEditorStore.getState().exitEdit();
          } else {
            useEditorStore.getState().enterEdit();
          }
        } catch {}
      }
    }
  }, [user?.username, isOwner, viewerChanged, isMobile]);


  // Handle photo upload
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Image must be smaller than 50MB');
      return;
    }

    try {
      file = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });

      toast.success('Updating profile photo...');

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
      throw error; // Re-throw to let the component handle it
    }
  };

  // Handle description save
  const handleDescriptionSave = async (description: string) => {
    try {
      await updateUserProfile({ 
        description: description 
      });
      fetchProfileData();
      // Update publicProfile state immediately so the description reflects in the UI
      setPublicProfile(prev => ({
        ...prev,
        description: description
      }));
      toast.success('Profile description updated successfully!');
    } catch (error) {
      console.error('Failed to update profile description:', error);
      toast.error('Failed to update profile description');
      throw error; // Re-throw to let the component handle it
    }
  };

  return (
    <SidebarLayout showSidebar={viewState === 'OwnerEdit'} avatarUrl={profileData?.profileImage}>
      <EditorController isHomeUser={isOwner} page={'ProfileOverview'} />
      <div className="container mx-auto px-4 py-20 max-w-4xl mt-8">
        {/* Header with Avatar */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            <ProfileAvatar
              src={(isOwnerEdit || isOwner) ? profileData?.profileImage : (publicProfile?.profileImage || "")}
              alt={
                isOwnerEdit
                  ? ((user?.username || (username as string)) as string)
                  : ((publicProfile?.username || user?.username || (username as string)) as string)
              }
              size="xl"
              editable={isOwnerEdit}
              onImageUpload={isOwnerEdit ? handlePhotoUpload : undefined}
            />
            
            <h1 className="text-3xl font-bold">
              {publicProfile?.username || user?.username || (username as string) || "no-name"}
            </h1>
          </div>
          
          {/* Editable Description */}
          <div className="mt-4">
            <EditableDescription
              description={(publicProfile?.description || "") || (profileData?.description || "")}
              onSave={handleDescriptionSave}
              placeholder="Enter your profile description..."
              textClassName={isOwnerEdit ? undefined : "cursor-default select-text"}
              textareaClassName={isOwnerEdit ? undefined : "cursor-default select-text"}
              disabled={!isOwnerEdit}
            />
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          {publicLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : publicProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects yet. Start creating!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicProjects.map((project) => (
                <ProjectCard key={project.id} username={username} project={project}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
        );
};

export default ProfileOverview;
