import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { LoginForm } from '@/components/login-form';
import { useAuth } from "@/context/AuthContext";

const API_URL = 'http://localhost:3001/api/auth';

const LoginRegister: React.FC = () => {
  const navigate = useNavigate(); // Add this hook
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const endpoint = mode === 'login' ? '/login' : '/register';
    console.log(`Endpoint: ${endpoint}`);
    const body: any = { email, password };
    if (mode === 'register') body.username = username;
    console.log(`Body: ${JSON.stringify(body)}`);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Success!');
        console.log(data);
        login(data.token, { email: data.email, username: data.username });
        navigate('/project');
      } else {
        setMessage(data.message || 'Error');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        message={message}
      />
    </div>
  );
};

export default LoginRegister;
