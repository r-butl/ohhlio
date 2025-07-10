import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"

function UndoButton({ onUndo }: { onUndo: () => void }) {
  return (
    <Button variant="outline" onClick={onUndo}>
      <Undo2 className="h-2 w-2" />
      <span className="sr-only">Undo</span>
    </Button>
  )
}

export default UndoButton;