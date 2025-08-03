// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectEditor from '@/pages/CreatorDashboard';
import LoginRegister from '@/pages/Login';
import { UserProvider } from '@/context/UserContext';
import FileUploadBox from '@/components/creator-dashboard/FileUploadBox';
import { testBackendEndpoints } from '@/utils/backendCheck';

import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // Test backend connectivity when app loads
    testBackendEndpoints();
  }, []);

  return (
    <UserProvider>
      {/* <PublicProjectsProvider> */}
        <BrowserRouter>
          <FileUploadBox />
          <Toaster />
          <Routes>

            <Route path="/:username/project" element={<ProjectEditor />} />
            <Route path="/:username/project/:projectId" element={<ProjectEditor />} />
            <Route path="/project" element={<ProjectEditor />} />
            <Route path="/" element={<LoginRegister />} />
            {/* Add more routes as needed */}
          </Routes>
        </BrowserRouter>
      {/* </PublicProjectsProvider> */}
    </UserProvider>
  );
}

export default App;