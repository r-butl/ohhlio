import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import SidebarLayout from "@/layouts/SidebarLayout";
import { useParams } from "react-router-dom";
import { updateUserProfile, uploadProfileImage } from "@/services/userService";
import { toast } from "sonner";
import EditableDescription from "@/components/ui/editable-description";
import EditableAvatar from "@/components/ui/editable-avatar";
import ProjectCard from "@/components/profile-overview/ProjectCard"
import { useEditorStore } from "@/context/EditorStore";

const ProfileOverview: React.FC = () => {
  const { user } = useAuth();
  const { profileData, fetchProfileData } = useUserContext();
  const projects = useEditorStore(state => state.projects);
  const loadingProjects = useEditorStore(state => state.loadingProjects);
  const fetchProjects = useEditorStore(state => state.fetchProjects);
  const { username } = useParams();
  const isOwner = user?.username === username;

  // Load private profile and projects only for the owner
  useEffect(() => {
    if (user && isOwner) {
      fetchProfileData();
      fetchProjects();
    }
  }, [user, isOwner]);


  // Handle photo upload
  const handlePhotoUpload = async (file: File) => {
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

    try {

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
      toast.success('Profile description updated successfully!');
    } catch (error) {
      console.error('Failed to update profile description:', error);
      toast.error('Failed to update profile description');
      throw error; // Re-throw to let the component handle it
    }
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
            <EditableAvatar
              imageUrl={profileData.profileImage}
              alt={user.username}
              size="lg"
              onImageUpload={handlePhotoUpload}
              disabled={!isOwner}
            />
            
            <h1 className="text-3xl font-bold">
              {user.username || "no-name"}
            </h1>
          </div>
          
          {/* Editable Description */}
          <div className="mt-4">
            <EditableDescription
              description={profileData.description || ""}
              onSave={handleDescriptionSave}
              placeholder="Enter your profile description..."
              disabled={!isOwner}
            />
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
