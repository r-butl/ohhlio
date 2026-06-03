import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EditableDescriptionProps {
  description: string;
  onSave: (description: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  buttonSize?: 'sm' | 'default' | 'lg';
  isEditable?: boolean;
}

const EditableDescription: React.FC<EditableDescriptionProps> = ({
  description,
  onSave,
  placeholder = "Enter description...",
  className = "",
  textareaClassName = "min-h-[80px] resize-none",
  buttonSize = "sm",
  isEditable = false,

}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);
  const [isSaving, setIsSaving] = useState(false);

  // Update tempDescription when description prop changes (but not while editing to avoid overwriting user input)
  useEffect(() => {
    if (!isEditing) {
      setTempDescription(description);
    }
  }, [description, isEditing]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(tempDescription);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save description:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempDescription(description);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    if (!isEditable) return;
    setTempDescription(description);
    setIsEditing(true);
  };

  return (
    <div className={className}>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            className={textareaClassName}
            placeholder={placeholder}
          />
          <div className="flex gap-2">
            <Button 
              size={buttonSize} 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              size={buttonSize} 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (

        ((isEditable || description) &&
          <p
            className={isEditing ? `text-muted-foreground text-sm p-1 rounded` : `text-sm text-muted-foreground line-clamp-2 cursor-pointer p-1 rounded transition-colors ${ isEditable ? 'hover:bg-muted/100' : '' }`}
            style={!isEditable ? { cursor: 'default' } : {}}
            onClick={handleStartEditing}
          >
            {description || placeholder}
          </p>
        )
        
      )}
    </div>
  );
};

export default EditableDescription;
