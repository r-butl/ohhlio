import { CirclePlus } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";
import { useUserContext } from "@/context/UserContext";

function AddProjectButton() {
  const { user } = useUserContext();
  
  return (
    <SidebarMenuButton asChild>
      <a href={`/${user.username}/project`}>
        <CirclePlus />
        <span>Add Project</span>
      </a>
    </SidebarMenuButton>
  )
}

export default AddProjectButton;