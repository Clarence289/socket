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
};
const API_URL = getApiUrl();

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    if (!pass) return '';
    if (pass.length < 8) return 'weak';
    if (!PASSWORD_REGEX.test(pass)) return 'medium';
    return 'strong';
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }
    
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setConnectionError(null);
    setSuccessMessage('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log(`📝 Attempting registration to: ${API_URL}/api/register`);
      
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password, 
          avatar: avatar.trim() || null 
        }),
      });
      
      if (!res.ok) {
        if (res.status >= 500) {
          setConnectionError('Server error. Please try again later.');
          return;
        }
        if (res.status === 404) {
          setConnectionError('Registration service not found. Check server connection.');
          return;
        }
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log('✅ Registration successful');
        setSuccessMessage('Account created successfully! Redirecting to login...');
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAvatar('');
        
        // Redirect after short delay to show success message
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
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
        padding: '20px 10px'
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95);}
            to { opacity: 1; transform: scale(1);}
          }
          .register-card {
            box-shadow: 0 8px 32px rgba(44,62,80,0.18);
            border-radius: 24px;
            background: rgba(36,37,38,0.98);
            padding: 40px 32px 32px 32px;
            width: 100%;
            max-width: 420px;
            animation: fadeIn 1.2s;
            position: relative;
          }
          .register-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          .register-logo img {
            width: 48px;
            height: 48px;
            margin-right: 12px;
            filter: drop-shadow(0 2px 8px #6c5ce7aa);
          }
          .register-title {
            color: #e4e6eb;
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 18px;
            letter-spacing: 1px;
          }
          .register-input {
            width: 100%;
            margin-bottom: 16px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #292b2f;
            color: #e4e6eb;
            border: 1px solid #3a3b3c;
            font-size: 1.08rem;
            transition: background 0.2s, border-color 0.2s;
            box-shadow: 0 2px 8px #0002;
            box-sizing: border-box;
          }
          .register-input:focus {
            background: #232526;
            outline: none;
            border-color: #6c5ce7;
          }
          .register-password-wrap {
            position: relative;
            margin-bottom: 16px;
          }
          .register-password-input {
            width: 100%;
            padding: 12px 38px 12px 14px;
            border-radius: 10px;
            background: #292b2f;
            color: #e4e6eb;
            border: 1px solid #3a3b3c;
            font-size: 1.08rem;
            box-sizing: border-box;
          }
          .register-password-input:focus {
            background: #232526;
            outline: none;
            border-color: #6c5ce7;
          }
          .register-eye {
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
          .register-btn {
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
            box-shadow: 0 2px 8px #6c5ce7aa;
            transition: background 0.2s, transform 0.2s;
          }
          .register-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .register-btn:hover:not(:disabled) {
            background: linear-gradient(90deg, #764ba2 0%, #6c5ce7 100%);
            transform: scale(1.04);
          }
          .register-error {
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
          .success-message {
            color: #00b894;
            margin-top: 10px;
            text-align: center;
            font-weight: bold;
            padding: 12px;
            background: rgba(0, 184, 148, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 184, 148, 0.3);
          }
          .register-link {
            display: block;
            text-align: center;
            margin-top: 18px;
            color: #6c5ce7;
            text-decoration: none;
            font-weight: 500;
            font-size: 1rem;
            transition: color 0.2s;
          }
          .register-link:hover {
            color: #fdcb6e;
          }
          .password-strength {
            margin-top: -12px;
            margin-bottom: 12px;
            font-size: 0.85em;
            text-align: center;
          }
          .strength-weak { color: #e17055; }
          .strength-medium { color: #fdcb6e; }
          .strength-strong { color: #00b894; }
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
            .register-card {
              padding: 24px 16px 16px 16px;
              max-width: 95vw;
              margin: 10px;
            }
            .register-title {
              font-size: 1.5rem;
            }
            .register-logo img {
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
      
      <form className="register-card" onSubmit={handleRegister}>
        <div className="register-logo">
          <img src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png" alt="App Logo" />
          <span style={{ color: '#e4e6eb', fontWeight: 700, fontSize: '1.3rem', textShadow: '0 2px 8px #6c5ce7aa' }}>
            Socket Chat
          </span>
        </div>
        
        <div className="register-title">Create Account</div>
        
        {/* Connection Status Indicators */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            🔧 Backend: {API_URL}
          </div>
        )}
        
        {process.env.NODE_ENV === 'production' && (
          <div className="production-status">
            <span>🌐</span>
            Connected to Cloud Server
          </div>
        )}
        
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
        
        <div className="register-password-wrap">
          <input
            className="register-password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => handlePasswordChange(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
          <span
            className="register-eye"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={0}
            title={showPassword ? 'Hide password' : 'Show password'}
            role="button"
            aria-label="Toggle password visibility"
          >
            {showPassword ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6c5ce7" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94C16.13 19.13 14.13 20 12 20c-7 0-11-8-11-8a21.91 21.91 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29M1 1l22 22" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            )}
          </span>
        </div>
        
        {/* Password Strength Indicator */}
        {password && (
          <div className="password-strength">
            <span className={`strength-${passwordStrength}`}>
              Password strength: {passwordStrength === 'weak' && '🔴 Weak'}
              {passwordStrength === 'medium' && '🟡 Medium'}
              {passwordStrength === 'strong' && '🟢 Strong'}
            </span>
          </div>
        )}
        
        <div className="register-password-wrap">
          <input
            className="register-password-input"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
          />
          <span
            className="register-eye"
            onClick={() => setShowConfirmPassword(v => !v)}
            tabIndex={0}
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
            role="button"
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6c5ce7" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94C16.13 19.13 14.13 20 12 20c-7 0-11-8-11-8a21.91 21.91 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29M1 1l22 22" stroke="#6c5ce7" strokeWidth="2"/>
              </svg>
            )}
          </span>
        </div>
        
        {/* Password Match Indicator */}
        {confirmPassword && (
          <div className="password-strength">
            <span className={password === confirmPassword ? 'strength-strong' : 'strength-weak'}>
              {password === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
            </span>
          </div>
        )}
        
        <input
          className="register-input"
          type="url"
          placeholder="Avatar URL (optional)"
          value={avatar}
          onChange={e => setAvatar(e.target.value)}
          disabled={loading}
        />
        
        <button className="register-btn" type="submit" disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🔄</span> Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
        
        {error && <div className="register-error">❌ {error}</div>}
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
        {successMessage && <div className="success-message">✅ {successMessage}</div>}
        
        <a className="register-link" href="/login">
          Already have an account? Login
        </a>
        
        {/* Password Requirements (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: 16, 
            padding: '8px 12px', 
            background: 'rgba(116, 75, 162, 0.1)', 
            borderRadius: 8, 
            border: '1px solid rgba(116, 75, 162, 0.3)',
            fontSize: '0.8em',
            color: '#b2bec3'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Password Requirements:</div>
            <div>• At least 8 characters</div>
            <div>• One uppercase letter</div>
            <div>• One lowercase letter</div>
            <div>• One number</div>
            <div>• One special character (@$!%*?&)</div>
          </div>
        )}
      </form>
    </div>
  );
}