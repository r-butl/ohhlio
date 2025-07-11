import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { useEditorStore } from "../../context/EditorStore";


function UndoButton({  }: {}) {
  const undo = useEditorStore(state => state.undo);
  return (
    <Button variant="outline" onClick={() => undo()} className='h-8 w-8 aspect-square p-1'>
      <RotateCcw className="h-2 w-2" />
      <span className="sr-only">Undo</span>
    </Button>
  )
}

export default UndoButton;
