import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Replace with your PC's IP address for phone access
  const API_URL = 'http://192.168.0.203:5000/api/login';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
        navigate('/join'); // Redirect to join page after login
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 1.2s',
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95);}
            to { opacity: 1; transform: scale(1);}
          }
          .login-card {
            box-shadow: 0 8px 32px rgba(44,62,80,0.18);
            border-radius: 24px;
            background: rgba(36,37,38,0.98);
            padding: 40px 32px 32px 32px;
            width: 100%;
            max-width: 400px;
            animation: fadeIn 1.2s;
            position: relative;
          }
          .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          .login-logo img {
            width: 48px;
            height: 48px;
            margin-right: 12px;
          }
          .login-title {
            color: #e4e6eb;
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 18px;
            letter-spacing: 1px;
          }
          .login-input {
            width: 100%;
            margin-bottom: 16px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #292b2f;
            color: #e4e6eb;
            border: 1px solid #3a3b3c;
            font-size: 1.08rem;
            transition: background 0.2s;
          }
          .login-input:focus {
            background: #232526;
            outline: none;
            border-color: #6c5ce7;
          }
          .login-password-wrap {
            position: relative;
            margin-bottom: 16px;
          }
          .login-password-input {
            width: 100%;
            padding: 12px 38px 12px 14px;
            border-radius: 10px;
            background: #292b2f;
            color: #e4e6eb;
            border: 1px solid #3a3b3c;
            font-size: 1.08rem;
            box-sizing: border-box;
          }
          .login-password-input:focus {
            background: #232526;
            outline: none;
            border-color: #6c5ce7;
          }
          .login-eye {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #6c5ce7;
            font-size: 1.2rem;
            height: 24px;
            display: flex;
            align-items: center;
          }
          .login-btn {
            width: 100%;
            padding: 12px;
            border-radius: 10px;
            background: linear-gradient(90deg, #6c5ce7 60%, #764ba2 100%);
            color: #fff;
            border: none;
            font-weight: bold;
            font-size: 1.08rem;
            margin-bottom: 10px;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
          }
          .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .login-btn:hover:not(:disabled) {
            background: linear-gradient(90deg, #764ba2 0%, #6c5ce7 100%);
            transform: scale(1.04);
          }
          .login-error {
            color: #d63031;
            margin-top: 10px;
            text-align: center;
            font-weight: bold;
          }
          .login-link {
            display: block;
            text-align: center;
            margin-top: 18px;
            color: #6c5ce7;
            text-decoration: none;
            font-weight: 500;
            font-size: 1rem;
            transition: color 0.2s;
          }
          .login-link:hover {
            color: #fdcb6e;
          }
          @media (max-width: 480px) {
            .login-card {
              padding: 24px 8px 16px 8px;
              max-width: 98vw;
            }
            .login-title {
              font-size: 1.3rem;
            }
            .login-logo img {
              width: 36px;
              height: 36px;
              margin-right: 8px;
            }
          }
        `}
      </style>
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">
          <img src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png" alt="App Logo" />
          <span style={{ color: '#e4e6eb', fontWeight: 700, fontSize: '1.3rem' }}>Socket Chat</span>
        </div>
        <div className="login-title">Login</div>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="login-password-wrap">
          <input
            className="login-password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <span
            className="login-eye"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={0}
            title={showPassword ? 'Hide password' : 'Show password'}
            role="button"
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              // Eye open SVG
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6c5ce7" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#6c5ce7" strokeWidth="2"/></svg>
            ) : (
              // Eye closed SVG
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94C16.13 19.13 14.13 20 12 20c-7 0-11-8-11-8a21.91 21.91 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29M1 1l22 22" stroke="#6c5ce7" strokeWidth="2"/></svg>
            )}
          </span>
        </div>
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div className="login-error">{error}</div>}
        <a className="login-link" href="/register">Don't have an account? Register</a>
      </form>
    </div>
  );
}