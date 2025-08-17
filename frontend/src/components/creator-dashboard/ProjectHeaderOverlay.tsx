import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/context/EditorStore';
import { updateProject } from '@/services/projectService';
import { uploadAsset } from '@/services/assetService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image, Upload, X } from 'lucide-react';

interface ProjectHeaderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectHeaderOverlay: React.FC<ProjectHeaderOverlayProps> = ({ isOpen, onClose }) => {
  const projectHeader = useEditorStore(state => state.projectHeader);
  const projectId = useEditorStore(state => state.projectId);
  const setProjectHeader = useEditorStore(state => state.setProjectHeader);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [headerPhoto, setHeaderPhoto] = useState<File | null>(null);
  const [headerPhotoPreview, setHeaderPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with current values when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTitle(projectHeader.title || '');
      setDescription(projectHeader.description || '');
      setHeaderPhoto(null);
      setHeaderPhotoPreview(null);
    }
  }, [isOpen, projectHeader.title, projectHeader.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsLoading(true);
    
    try {
      let headerPhotoId = projectHeader.headerPhotoId;

      // Upload header photo if provided
      if (headerPhoto) {
        const asset = await uploadAsset(headerPhoto, projectId);
        headerPhotoId = asset.id;
      }

      // Update project on backend
      await updateProject(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        headerPhotoId: headerPhotoId || undefined,
      });

      // Update local store
      setProjectHeader({
        ...projectHeader,
        title: title.trim(),
        description: description.trim() || undefined,
        headerPhotoId: headerPhotoId || undefined,
      });

      toast.success('Project updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      
      setHeaderPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setHeaderPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeHeaderPhoto = () => {
    setHeaderPhoto(null);
    setHeaderPhotoPreview(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project title and description. These changes will be saved immediately.
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

          <div className="space-y-2">
            <Label>Header Photo</Label>
            <div className="space-y-3">
              {/* Current header photo preview */}
              {projectHeader.headerPhotoId && !headerPhotoPreview && (
                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Current header photo</span>
                  </div>
                </div>
              )}
              
              {/* New header photo preview */}
              {headerPhotoPreview && (
                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={headerPhotoPreview} 
                    alt="Header photo preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeHeaderPhoto}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Upload button */}
              {!headerPhotoPreview && (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="header-photo" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Upload header photo</span>
                    </div>
                    <input
                      id="header-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleHeaderPhotoChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectHeaderOverlay;
