import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import AddProjectButton from "@/components/buttons/AddProject";
import { NavProjects } from "@/components/dashboard/editor-sidebar/nav-projects"
import { NavUser } from "@/components/dashboard/editor-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUserContext } from "@/context/UserContext";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const user = useUserContext().user;

  return (
    <Sidebar variant="inset" {...props}>

      {/* Project Header */}
      <SidebarHeader>
        <NavUser user={{
          name: user.username,
          email: user.email,
          avatar: ""
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
