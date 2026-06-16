import { useRef } from "react";
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { compressImage } from "@/utils/compressImage"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
  } from "@/components/ui/DropdownMenu"

import { useEditorStore } from "../../context/EditorStore";

function AddContentButton({}: {}) {
    const addTextBox = useEditorStore(state => state.addTextBox);
    const addImage = useEditorStore(state => state.addImage);
    const addSection = useEditorStore(state => state.addSection);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB safety net — compression handles the rest

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (selectedFiles.length === 0) return;

        // Safety net — reject files that are truly absurd in size (50MB+)
        const validFiles = selectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
        const invalidFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);

        if (invalidFiles.length > 0) {
            toast.error(`${invalidFiles.length} image${invalidFiles.length > 1 ? 's' : ''} skipped — file size must be under 50MB`);
        }

        if (validFiles.length === 0) return;

        for (const file of validFiles) {
            try {
                const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 });
                const reader = new FileReader();
                reader.onload = () => {
                    addImage(reader.result as string);
                };
                reader.readAsDataURL(compressed);
            } catch {
                toast.error(`Failed to process ${file.name}`);
            }
        }
    };

    const handleAddImageClick = () => {
        setTimeout(() => fileInputRef.current?.click(), 0);
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
        <DropdownMenuContent className="w-56 bg-system text-system-foreground border-system" align="start">
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
            <DropdownMenuItem onClick={() => addSection()}>
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