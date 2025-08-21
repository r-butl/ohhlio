import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";
import { createProject } from "@/services/projectService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddProjectOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProjectOverlay: React.FC<AddProjectOverlayProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }

    setIsLoading(true);

    try {
      const newProject = await createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        items: {},
        isPublic: false,
      });

      toast.success("Project created successfully!");

      // Reset form
      setTitle("");
      setDescription("");

      // Close overlay
      onClose();

      // Navigate to the new project
      if (user?.username) {
        console.log('Navigating to new project:', newProject);
        console.log('User username:', user.username);
        console.log('Project ID:', newProject.id);
        navigate(`/${user.username}/project/${newProject.id}`);
      } else {
        console.error('User username is missing:', user);
        // Fallback: navigate to the user's project page
        navigate(`/${user.username}/project`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a name and description for your new project. You can always edit
            these later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Name *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project name..."
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectOverlay;
