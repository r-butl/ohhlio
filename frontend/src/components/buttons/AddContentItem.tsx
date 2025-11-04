import { useRef } from "react";
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

import { useEditorStore } from "../../context/EditorStore";

function AddContentButton({}: {}) {
    const addTextBox = useEditorStore(state => state.addTextBox);
    const addImage = useEditorStore(state => state.addImage);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        
        if (selectedFiles.length === 0) return;
        
        // Filter out files that are too large
        const validFiles = selectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
        const invalidFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
        
        if (invalidFiles.length > 0) {
            alert(`${invalidFiles.length} file(s) are too large (max 10MB) and will be skipped.`);
        }
        
        if (validFiles.length === 0) {
            alert('No valid files to upload.');
            // Reset input to allow selecting the same files again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Process each valid file
        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const imageData = reader.result as string;
                addImage(imageData);
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input to allow selecting the same files again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddImageClick = () => {
        fileInputRef.current?.click();
    };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className='h-8 w-8 aspect-square p-1'>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Undo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => addTextBox()}>
              Add Text
              <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddImageClick}>
              Add Image
              <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              Add Video
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              Add Section
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}


export default AddContentButton;