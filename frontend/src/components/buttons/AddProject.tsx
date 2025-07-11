import { CirclePlus } from "lucide-react";
import { Button } from "../ui/button";
import { SidebarMenuButton } from "../ui/sidebar";

function AddProjectButton({}: {}) {
  return (
    <SidebarMenuButton >
      <CirclePlus />
      <span>Add Project</span>
    </SidebarMenuButton>
  )
}

export default AddProjectButton;