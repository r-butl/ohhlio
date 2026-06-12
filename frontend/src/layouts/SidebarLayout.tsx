import { AppSidebar } from "@/components/editor-sidebar/AppSidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Sidebar"

function SidebarLayout({ children, showSidebar = false, avatarUrl }: { children: React.ReactNode, showSidebar?: boolean, avatarUrl?: string }) {
  return (
    
    <SidebarProvider>
      {showSidebar && <AppSidebar avatarUrl={avatarUrl} />}
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SidebarLayout;