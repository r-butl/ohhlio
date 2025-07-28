import * as React from "react"
import {
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
} from "lucide-react"

import AddProjectButton from "@/components/buttons/AddProject";
import { NavProjects } from "@/components/editor-sidebar/nav-projects"
import { NavUser } from "./nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { useUserContext } from "@/context/UserContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { user } = useUserContext();

  return (
    <Sidebar variant="inset" {...props}>

      {/* Project Header */}
      <SidebarHeader>
        <NavUser user={{ 
          name: user.username,
          email:  user.email,
          avatar: "/avatars/shadcn.jpg"
          }}/>
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
