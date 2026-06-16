import { AppSidebar } from "@/components/editor-sidebar/AppSidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Sidebar"

function SidebarLayout({ children, isOwner = false, avatarUrl }: { children: React.ReactNode, isOwner?: boolean, avatarUrl?: string }) {
  return (
    <SidebarProvider defaultOpen={isOwner}>
      {isOwner && <AppSidebar avatarUrl={avatarUrl} />}
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SidebarLayout;
