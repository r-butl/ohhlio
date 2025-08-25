import { CirclePlus } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";
import { useUserContext } from "@/context/UserContext";
import AddProjectOverlay from '@/components/creator-dashboard/AddProjectOverlay';

import React, { useState } from 'react';

function AddProjectButton() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const handleClick = () => {
    setIsAddProjectOpen(true);

  }

  return (
    <>
      <SidebarMenuButton asChild onClick={() => {handleClick()}}>
        <div>
          <CirclePlus />
          <span>Add Project</span>
        </div>
      </SidebarMenuButton>

      <AddProjectOverlay 
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
      />
    </>

  )
}

export default AddProjectButton;