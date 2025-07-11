import { CirclePlus } from "lucide-react";
import { Button } from "../ui/button";

function AddProjectButton({}: {}) {
  return (
    <Button variant="ghost" className='h-8 w-8 aspect-square p-1'>
      <CirclePlus />
      <span>Add Project</span>
    </Button>
  )
}

export default AddProjectButton;