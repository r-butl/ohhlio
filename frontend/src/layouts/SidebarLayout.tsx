import { AppSidebar } from "@/components/editor-sidebar/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SidebarLayout;