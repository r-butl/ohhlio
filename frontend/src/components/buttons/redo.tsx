import { Button } from "@/components/ui/button"
import { Redo2 } from "lucide-react"

function RedoButton({ onRedo }: { onRedo: () => void }) {
  return (
    <Button variant="outline" onClick={onRedo}>
      <Redo2 className="h-2 w-2" />
      <span className="sr-only">Redo</span>
    </Button>
  )
}

export default RedoButton;