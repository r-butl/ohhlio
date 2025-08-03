import React, { useContext } from 'react';
import { Button } from "@/components/ui/button";
import { useEditorStore } from '@/context/EditorStore';
import { createProject, updateProject, getProjects } from '@/services/projectService';
import { toast } from 'sonner';
import { UserContext } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

const PublishButton: React.FC = () => {

    const userContext = useContext(UserContext);
    const navigate = useNavigate();
    if (!userContext) {
        throw new Error('PublishButton must be used within a UserProvider');
    }
    const { fetchProjects, user } = userContext;
    const setProjectId = useEditorStore(state => (state.setProjectId));


    const handlePublish = async () => {

        const projectId = useEditorStore.getState().projectId;
        const items = useEditorStore.getState().items;

        // Filter out empty items
        const filteredItems = Object.fromEntries(
            Object.entries(items).filter(([itemId, item]) => {
                // Keep text items that have content
                if (item.type === 'text') {
                    return item.props.content && item.props.content.trim() !== '';
                }
                
                // Keep image items that have assetId or originalImage
                if (item.type === 'image') {
                    return item.props.assetId || item.props.originalImage;
                }
                
                // Keep other item types that have assetId or assetUrl
                return item.props.assetId || item.props.assetUrl;
            })
        );

        console.log(`Filtered ${Object.keys(items).length - Object.keys(filteredItems).length} empty items`);

        if (!projectId) {

            // This is a new project, so we need a title.
            const title = prompt("Please enter a title for your new project:");
            if (!title) {
                toast.error("A project title is required to publish.");
                return;
            }

            // Check if title already exists for this user
            try {
                const existingProjects = await getProjects();
                const titleExists = existingProjects.some((project: any) => 
                    project.title.toLowerCase().trim() === title.toLowerCase().trim()
                );
                
                if (titleExists) {
                    toast.error("A project with this title already exists. Please choose a different title.");
                    return;
                }
            } catch (error) {
                console.error("Failed to check existing projects:", error);
                // Continue with creation even if we can't verify uniqueness
            }
            try {
                toast.loading("Processing assets and publishing new project...");
                
                // First, create the project to get an ID
                const newProject = await createProject({ title, items: {} });
                setProjectId(newProject.id);
                
                // update the project with the items
                await updateProject(newProject.id, { items: filteredItems });

                // Navigate to the project's page
                navigate(`/${user.username}/project/${newProject.id}`);
                
                toast.dismiss();
                toast.success("Project published successfully!");
            } catch (error) {
                toast.dismiss();
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                toast.error(`Failed to publish: ${errorMessage}`);
                console.error(error);
            }
            
            fetchProjects();

            
        } else {
            // This is an existing project, just save the changes.
            try {
                toast.loading("Processing assets and updating project...");
                
                // update the project with the items
                await updateProject(projectId, { items: filteredItems });
                
                toast.dismiss();
                toast.success("Project updated successfully!");
            } catch (error) {
                toast.dismiss();
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                toast.error(`Failed to update: ${errorMessage}`);
                console.error(error);
            }
        }
    };

    return (
        <Button
            variant="default"
            onClick={handlePublish}
        >
            Publish
        </Button>
    );
}

export default PublishButton;