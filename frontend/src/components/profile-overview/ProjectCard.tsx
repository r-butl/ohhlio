import { Card, CardContent, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect, useInsertionEffect } from "react";
import { useProjectNavigation } from "@/hooks/useProjectNavigation";
import { useEditorStore } from "@/context/EditorStore";

interface ProjectCardProps {
    username: string | undefined
    project: any
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    username,
    project
}) => {

    const { navigateToProject } = useProjectNavigation();
    const getAssetFromCacheOrBackend = useEditorStore( state => state.getAssetFromCacheOrBackend);
    const [ headerPhotoURL, setHeaderPhotoURL ] = useState("");

    useEffect(() => {
        const loadAsset = async() => {
            if (project.headerPhotoId){
                const token = localStorage.getItem('token');
                try {
                    if (token) {
                const asset = await getAssetFromCacheOrBackend(project.headerPhotoId);
                setHeaderPhotoURL(asset);
                    } else {
                        const { getPublicAssetById } = await import('@/services/assetService');
                        const url = await getPublicAssetById(project.headerPhotoId);
                        setHeaderPhotoURL(url);
                    }
                } catch (e) {
                    setHeaderPhotoURL("");
                }
            } else {
                setHeaderPhotoURL("");
            }
        }
        loadAsset();
    }, [project.headerPhotoId, getAssetFromCacheOrBackend])

    return (
     <Card 
        key={project.projectId} 
        className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
        onClick={() => {
            navigateToProject(project.id, username || '')
        }}
    >
        {/* Header Photo */}
        {headerPhotoURL && (
        <div className="w-full h-32 bg-muted relative">
            <img 
            src={headerPhotoURL}
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
    )
}

export default ProjectCard;
