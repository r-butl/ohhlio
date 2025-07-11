import { Button } from "@/components/ui/button"
import { RotateCw } from "lucide-react"
import { useEditorStore } from "../../context/EditorStore";


function RedoButton({  }: {}) {
  const redo = useEditorStore(state => state.redo);
  return (
    <Button variant="outline" onClick={() => redo()} className='h-8 w-8 aspect-square p-1'>
      <RotateCw className="h-2 w-2" />
      <span className="sr-only">Redo</span>
    </Button>
  )
}

export default RedoButton;
