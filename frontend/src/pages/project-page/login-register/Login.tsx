import React, { useState } from 'react';

const API_URL = 'http://localhost:3001/api/auth';

const LoginRegister: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setToken('');
    const endpoint = mode === 'login' ? '/login' : '/register';
    const body: any = { email, password };
    if (mode === 'register') body.username = username;
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Success!');
        setToken(data.token || '');
      } else {
        setMessage(data.message || 'Error');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: 12 }}>
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>
      <button
        style={{ marginTop: 12 }}
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setMessage('');
          setToken('');
        }}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
      {token && (
        <div style={{ marginTop: 8, wordBreak: 'break-all' }}>
          <strong>JWT Token:</strong>
          <div>{token}</div>
        </div>
      )}
    </div>
  );
};

export default LoginRegister;
