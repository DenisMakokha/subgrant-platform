import React, { useState } from 'react';
import { authApi } from '../services/api';
import { saveToken } from '../utils/auth';

const Test: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      const response = await authApi.login(email, password);
      saveToken(response.token);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setResult(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Login</h1>
      <div>
        <div>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button onClick={handleLogin}>Test Login</button>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '10px' }}>
          <h2>Login Successful</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Test;