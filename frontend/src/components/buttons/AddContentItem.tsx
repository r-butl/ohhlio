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
    const setFileUploadSelected = useEditorStore(state => state.setFileUploadSelected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className='h-8 w-8 aspect-square p-1'>
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
          <DropdownMenuItem onClick={() => {setFileUploadSelected(true)}}>
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
  )
}


export default AddContentButton;