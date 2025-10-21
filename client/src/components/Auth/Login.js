import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🌐 PRODUCTION-READY: Smart URL detection for cloud deployment
const getApiUrl = () => {
  // Priority 1: Environment variables (set during deployment)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: Production auto-detection for Netlify frontend
  if (process.env.NODE_ENV === 'production') {
    // Auto-detect backend URL based on Netlify frontend URL
    const frontendUrl = window.location.origin;
    
    // If frontend is on Netlify, assume backend is on Render
    if (frontendUrl.includes('netlify.app')) {
      // Convert: https://socket.netlify.app -> https://socket.onrender.com
      return frontendUrl.replace('.netlify.app', '.onrender.com');
    }
    
    // Fallback for custom domains
    return frontendUrl.replace('www.', 'api.');
  }
  
  // Priority 3: Development fallback
  return 'http://localhost:5000';
};;

const API_URL = getApiUrl();

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setConnectionError(null);
    setLoading(true);
    
    try {
      console.log(`🔐 Attempting login to: ${API_URL}/api/login`);
      
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        if (res.status >= 500) {
          setConnectionError('Server error. Please try again later.');
          return;
        }
        if (res.status === 404) {
          setConnectionError('Login service not found. Check server connection.');
          return;
        }
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log('✅ Login successful');
        
        // Store user data in localStorage for persistence
        localStorage.setItem('chat_user', JSON.stringify(data.user));
        localStorage.setItem('chat_token', data.token || '');
        localStorage.setItem('chat_name', data.user?.name || data.user?.email || '');
        
        onLogin(data.user);
        navigate('/join'); // Redirect to join page after login
      } else {
        setError(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setConnectionError(`Cannot connect to server. Check if backend is running at ${API_URL}`);
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
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
            box-sizing: border-box;
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
            padding: 8px;
            background: rgba(214, 48, 49, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(214, 48, 49, 0.3);
          }
          .connection-error {
            color: #ff6b6b;
            margin-top: 10px;
            text-align: center;
            font-weight: bold;
            padding: 12px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 107, 107, 0.3);
            font-size: 0.9em;
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
          .debug-info {
            margin-top: 16px;
            padding: 8px 12px;
            background: rgba(116, 75, 162, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(116, 75, 162, 0.3);
            font-size: 0.85em;
            color: #b2bec3;
            text-align: center;
          }
          .production-status {
            margin-top: 16px;
            padding: 8px 12px;
            background: rgba(0, 184, 148, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 184, 148, 0.3);
            font-size: 0.9em;
            color: #00b894;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          @media (max-width: 480px) {
            .login-card {
              padding: 24px 16px 16px 16px;
              max-width: 95vw;
              margin: 20px 10px;
            }
            .login-title {
              font-size: 1.5rem;
            }
            .login-logo img {
              width: 36px;
              height: 36px;
              margin-right: 8px;
            }
            .debug-info, .production-status {
              font-size: 0.8em;
              padding: 6px 8px;
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
        
        
        {process.env.NODE_ENV === 'production' && (
          <div className="production-status">
            <span>🌐</span>
            Connected to Cloud Server
          </div>
        )}
        
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
        
        <div className="login-password-wrap">
          <input
            className="login-password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6c5ce7" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            ) : (
              // Eye closed SVG
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94C16.13 19.13 14.13 20 12 20c-7 0-11-8-11-8a21.91 21.91 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29M1 1l22 22" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            )}
          </span>
        </div>
        
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🔄</span> Logging in...
            </span>
          ) : (
            'Login'
          )}
        </button>
        
        {error && <div className="login-error">❌ {error}</div>}
        {connectionError && (
          <div className="connection-error">
            ⚠️ {connectionError}
            <div style={{ marginTop: 8, fontSize: '0.85em' }}>
              <button 
                type="button"
                onClick={() => window.location.reload()} 
                style={{ 
                  background: 'none', 
                  border: '1px solid #ff6b6b', 
                  color: '#ff6b6b', 
                  padding: '4px 12px', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
        
        <a className="login-link" href="/register">
          Don't have an account? Register
        </a>
        
        {/* Quick Demo Login (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@example.com');
                setPassword('demo123');
              }}
              style={{
                background: 'rgba(116, 75, 162, 0.2)',
                border: '1px solid rgba(116, 75, 162, 0.5)',
                color: '#764ba2',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.85em'
              }}
            >
              🧪 Use Credentials
            </button>
          </div>
        )}
      </form>
    </div>
  );
}