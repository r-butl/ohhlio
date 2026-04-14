import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/pages/login/login-page-components/LoginForm';
import { RegisterForm } from '@/pages/login/login-page-components/RegisterForm';


const LoginRegister: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const handlePanelSwitch = () => {
    setMode(mode === 'register' ? 'login' : 'register');
  }

  const handleSuccess = (username?: string) => {
    if (username) {
      navigate(`/${username}`)
    } else {
      navigate('/project')
    }
  }

  return (
    mode === 'login' ? (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoginForm
          toRegister={handlePanelSwitch}
          onSuccess={handleSuccess}
        />
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center h-screen">
        <RegisterForm
          toLogin={handlePanelSwitch}
          onSuccess={handleSuccess}
        />
      </div>
    )

  );
};

export default LoginRegister;
