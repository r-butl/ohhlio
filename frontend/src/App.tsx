// frontend/src/App.tsx
import React from 'react';
import './App.css';
import ProjectPage from './pages/project-page/ProjectPage';
import LoginRegister from './pages/login-register/Login';
      //      <LoginRegister/>


function App() {
  return (
    <div className="app">
      <ProjectPage />
    </div>
  );
}

export default App;