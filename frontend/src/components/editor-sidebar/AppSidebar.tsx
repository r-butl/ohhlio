import * as React from "react"

import AddProjectButton from "@/components/buttons/AddProject";
import { NavProjects } from "@/components/editor-sidebar/NavProjects";
import { NavUser } from "@/components/editor-sidebar/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/Sidebar"
import { useUserContext } from "@/context/UserContext";


export function AppSidebar({ avatarUrl, ...props }: React.ComponentProps<typeof Sidebar> & { avatarUrl?: string }) {

  const user = useUserContext().user;

  return (
    <Sidebar variant="inset" {...props}>

      {/* Project Header */}
      <SidebarHeader>
        <NavUser user={{
          name: user.username || "",
          email: user.email,
          avatar: avatarUrl || ""
        }} />
      </SidebarHeader>
      
      {/* Project Nav */}
      <SidebarContent>
        <NavProjects />
      </SidebarContent>

      {/* Add Projects button */}
      <SidebarFooter>
          <AddProjectButton />
      </SidebarFooter>
    </Sidebar>
  )
}
