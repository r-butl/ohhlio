// frontend/src/App.tsx
import React from 'react';
import './App.css';
import ProjectPage from './pages/project-page/ProjectPage';
import LoginRegister from './pages/project-page/login-register/Login';
      //<ProjectPage />

function App() {
  return (
    <div className="app">
      <LoginRegister/>
    </div>
  );
}

export default App;