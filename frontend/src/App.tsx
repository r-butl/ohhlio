import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectEditor from '@/pages/private-views/CreatorDashboard';
import LoginRegister from '@/pages/login/Login';
import { UserProvider } from '@/context/UserContext';
import ProfileOverview from '@/pages/private-views/edit-profile/UserProfile';
import CapturePage from '@/pages/capture/CapturePage';
import { Toaster } from 'sonner';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/:username" element={<ProfileOverview />} />
          <Route path="/:username/project" element={<ProjectEditor />} />
          <Route path="/:username/project/:projectId" element={<ProjectEditor />} />
          <Route path="/project" element={<ProjectEditor />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/" element={<LoginRegister />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;