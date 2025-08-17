import React, { useState } from 'react';
import { useEditorStore } from '@/context/EditorStore';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import ProjectHeaderOverlay from './ProjectHeaderOverlay';

const ProjectInfo: React.FC = () => {
  const projectHeader = useEditorStore(state => state.projectHeader);
  const projectId = useEditorStore(state => state.projectId);
  const editorMaxWidth = useEditorStore(state => state.editorMaxWidth);
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);

  if (!projectId) {
    return null; // Don't show anything if no project is selected
  }

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
      <div className="px-6 py-4 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 group">
        <div style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {projectHeader.title}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditOverlayOpen(true)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit project</span>
                </Button>
              </div>
              {projectHeader.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {projectHeader.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ProjectHeaderOverlay
        isOpen={isEditOverlayOpen}
        onClose={() => setIsEditOverlayOpen(false)}
      />
    </>
  );
};

export default ProjectInfo;
