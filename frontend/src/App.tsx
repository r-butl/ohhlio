// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectEditor from './pages/dashboard/ProjectEditor';
import LoginRegister from './pages/auth/Login';
import { UserProvider } from './context/UserContext';
import FileUploadBox from '@/components/dashboard/FileUploadBox';

import { Toaster } from 'sonner';

function App() {
  return (
    <UserProvider>
      {/* <PublicProjectsProvider> */}
        <BrowserRouter>
          <FileUploadBox />
          <Toaster />
          <Routes>
            <Route path="/project" element={<ProjectEditor />} />
            <Route path="/project/:projectId" element={<ProjectEditor />} />
            <Route path="/" element={<LoginRegister />} />
            {/* Add more routes as needed */}
          </Routes>
        </BrowserRouter>
      {/* </PublicProjectsProvider> */}
    </UserProvider>
  );
}

export default App;