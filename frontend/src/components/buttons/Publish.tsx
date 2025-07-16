import React from 'react';
import { Button } from "@/components/ui/button";
import { useEditorStore } from '@/context/EditorStore';
import { createProject, updateProject } from '@/services/projectService';
import { toast } from 'sonner';

const PublishButton: React.FC = () => {


    const handlePublish = async () => {

        const { projectId, items, setProjectId } = useEditorStore(state => ({
            projectId: state.projectId,
            items: state.items,
            setProjectId: state.setProjectId,
        }));

        if (!projectId) {
            // This is a new project, so we need a title.
            const title = prompt("Please enter a title for your new project:");
            if (!title) {
                toast.error("A project title is required to publish.");
                return;
            }
            try {
                toast.loading("Publishing new project...");
                const newProject = await createProject({ title, items });
                setProjectId(newProject.id);
                toast.dismiss();
                toast.success("Project published successfully!");
            } catch (error) {
                toast.dismiss();
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
                toast.error(`Failed to publish: ${errorMessage}`);
                console.error(error);
            }
        } else {
            // This is an existing project, just save the changes.
            try {
                toast.loading("Updating project...");
                await updateProject(projectId, { items });
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