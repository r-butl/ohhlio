import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';


const LoginRegister: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const handlePanelSwitch = () => {
    setMode(mode === 'register' ? 'login' : 'register');
  }

  const handleSuccess = () => {
    navigate('/project')
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
