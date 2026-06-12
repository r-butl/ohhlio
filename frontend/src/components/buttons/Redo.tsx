import { Button } from "@/components/ui/Button"
import { Redo } from "lucide-react"
import { useEditorStore } from "../../context/EditorStore";


function RedoButton({  }: {}) {
  const redo = useEditorStore(state => state.redo);
  const futureLength = useEditorStore(state => state.history.future.length);
  return (
    <Button 
      variant="ghost" 
      onClick={() => redo()} 
      className='h-8 w-8 aspect-square p-1'
      disabled={futureLength === 0}>
      <Redo className="h-2 w-2" />
      <span className="sr-only">Redo</span>
    </Button>
  )
}

export default RedoButton;
