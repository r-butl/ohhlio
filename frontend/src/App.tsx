// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectPage from './pages/project-page/ProjectPage';
import LoginRegister from './pages/login-register/Login';
import SidebarLayout from './components/layouts/SidebarLayout';
import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/project" element={<ProjectPage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="/" element={<LoginRegister />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;