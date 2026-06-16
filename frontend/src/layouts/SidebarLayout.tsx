import { AppSidebar } from "@/components/editor-sidebar/AppSidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Sidebar"

function SidebarLayout({ children, isOwner = false, avatarUrl }: { children: React.ReactNode, isOwner?: boolean, avatarUrl?: string }) {
  return (
    <SidebarProvider defaultOpen={isOwner} className="h-svh">
      {isOwner && <AppSidebar avatarUrl={avatarUrl} />}
      <SidebarInset className="overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default SidebarLayout;
