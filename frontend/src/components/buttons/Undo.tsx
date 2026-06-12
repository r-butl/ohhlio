import { Button } from "@/components/ui/Button"
import { Undo } from "lucide-react"
import { useEditorStore } from "../../context/EditorStore";


function UndoButton({  }: {}) {
  const undo = useEditorStore(state => state.undo);
  const pastLength = useEditorStore(state => state.history.past.length);
  return (
    <Button 
      variant="ghost" 
      onClick={() => undo()} 
      className='h-8 w-8 aspect-square p-1'
      disabled={pastLength === 0}>
      <Undo className="h-2 w-2" />
      <span className="sr-only">Undo</span>
    </Button>
  )
}
export default UndoButton;
