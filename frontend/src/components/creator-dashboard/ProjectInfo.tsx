import React, { useEffect, useState } from 'react';
import { useEditorStore } from '@/context/EditorStore';
import EditableDescription from '@/components/ui/editable-description';
import EditableHeaderImage from '@/components/ui/editable-header-image';

const ProjectInfo: React.FC = () => {
  const currentProject = useEditorStore(state => state.currentProject);
  const projectHeader = currentProject.projectHeader;
  const getAssetFromCacheOrBackend = useEditorStore(state => state.getAssetFromCacheOrBackend);
  const projectId = useEditorStore(state => state.projectId);
  const editorMaxWidth = useEditorStore(state => state.editorMaxWidth);
  const updateProjectDescription = useEditorStore(state => state.updateProjectDescription);
  const updateProjectHeaderImage = useEditorStore(state => state.updateProjectHeaderImage);

  const [ headerPhotoURL, setHeaderPhotoURL ] = useState('');

  if (!projectId) {
    return null; // Don't show anything if no project is selected
  }

  useEffect(() => {
    const loadAsset = async () => {
      if (projectHeader.headerPhotoId) {
        const asset = await getAssetFromCacheOrBackend(projectHeader.headerPhotoId);
        setHeaderPhotoURL(asset);
      } else {
        setHeaderPhotoURL('');
      }
    };
    loadAsset();
  }, [projectHeader.headerPhotoId]);

  const handleDescriptionSave = async (description: string) => {
    await updateProjectDescription(description);
  };

  const handleHeaderImageUpload = async (file: File) => {
    await updateProjectHeaderImage(file);
  };

  if (!projectHeader.title) {
    return (
      <div className="px-6 py-4 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-4 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
          {/* Header Image */}
          <div className="mb-4 w-full">
            <EditableHeaderImage
              imageUrl={headerPhotoURL}
              alt={`${projectHeader.title} header image`}
              height="md"
              onImageUpload={handleHeaderImageUpload}
            />
          </div>
          
          {/* Project Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {projectHeader.title}
                </h1>
              </div>
              <EditableDescription
                description={projectHeader.description || ""}
                onSave={handleDescriptionSave}
                placeholder="Add a project description..."
                textClassName="text-sm text-muted-foreground line-clamp-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                textareaClassName="min-h-[60px] resize-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectInfo;
