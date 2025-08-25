import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface EditableDescriptionProps {
  description: string;
  onSave: (description: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  textareaClassName?: string;
  buttonSize?: 'sm' | 'default' | 'lg';
}

const EditableDescription: React.FC<EditableDescriptionProps> = ({
  description,
  onSave,
  placeholder = "Enter description...",
  className = "",
  textClassName = "text-muted-foreground text-lg cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors",
  textareaClassName = "min-h-[80px] resize-none",
  buttonSize = "sm"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);
  const [isSaving, setIsSaving] = useState(false);

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
        <p 
          className={textClassName}
          onClick={handleStartEditing}
        >
          {description || placeholder}
        </p>
      )}
    </div>
  );
};

export default EditableDescription;
