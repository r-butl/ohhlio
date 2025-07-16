import { CirclePlus } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";

function AddProjectButton() {
  return (
    <SidebarMenuButton asChild>
      <a href="/project">
        <CirclePlus />
        <span>Add Project</span>
      </a>
    </SidebarMenuButton>
  )
}

export default AddProjectButton;