import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import SidebarLayout from "@/layouts/SidebarLayout";
import { useParams } from "react-router-dom";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";

const ProfileOverview: React.FC = () => {
  const { user } = useAuth();
  const { projects, loadingProjects } = useUserContext();
  const { username } = useParams();
  const { navigateToProject } = useProjectNavigation();

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
                 <Avatar className="w-20 h-20">
                 <AvatarImage src="/default-avatar.png" alt={user.username} />
                 <AvatarFallback className="text-lg">
                     {user.username ? user.username.charAt(0).toUpperCase() : "no-name"}
                 </AvatarFallback>
                 </Avatar>
                 
                 <h1 className="text-3xl font-bold">
                     {user.username || "no-name"}
                 </h1>
             </div>
             
             <p className="text-muted-foreground text-lg">
                 Welcome to my profile! I'm a creator who loves building amazing projects.
             </p>
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
