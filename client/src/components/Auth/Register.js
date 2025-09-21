import React, { useState } from 'react';

export default function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Replace with your PC's IP address for phone access
  const API_URL = 'http://192.168.0.203:5000/api/register';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, avatar }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/login';
      } else {
        setError(data.error || 'Register failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #232526 0%, #414345 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 1.2s' }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95);}
            to { opacity: 1; transform: scale(1);}
          }
          .register-card { box-shadow: 0 8px 32px rgba(44,62,80,0.18); border-radius: 24px; background: rgba(36,37,38,0.98); padding: 40px 32px 32px 32px; width: 100%; max-width: 400px; animation: fadeIn 1.2s; position: relative; }
          .register-logo { display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
          .register-logo img { width: 48px; height: 48px; margin-right: 12px; filter: drop-shadow(0 2px 8px #6c5ce7aa); }
          .register-title { color: #e4e6eb; font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 18px; letter-spacing: 1px; }
          .register-input { width: 100%; margin-bottom: 16px; padding: 12px 14px; border-radius: 10px; background: #292b2f; color: #e4e6eb; border: 1px solid #3a3b3c; font-size: 1.08rem; transition: background 0.2s, border-color 0.2s; box-shadow: 0 2px 8px #0002; }
          .register-input:focus { background: #232526; outline: none; border-color: #6c5ce7; }
          .register-password-wrap { position: relative; margin-bottom: 16px; }
          .register-password-input { width: 100%; padding: 12px 38px 12px 14px; border-radius: 10px; background: #292b2f; color: #e4e6eb; border: 1px solid #3a3b3c; font-size: 1.08rem; box-sizing: border-box; }
          .register-password-input:focus { background: #232526; outline: none; border-color: #6c5ce7; }
          .register-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #6c5ce7; font-size: 1.2rem; height: 24px; display: flex; align-items: center; }
          .register-btn { width: 100%; padding: 12px; border-radius: 10px; background: linear-gradient(90deg, #6c5ce7 60%, #764ba2 100%); color: #fff; border: none; font-weight: bold; font-size: 1.08rem; margin-bottom: 10px; cursor: pointer; box-shadow: 0 2px 8px #6c5ce7aa; transition: background 0.2s, transform 0.2s; }
          .register-btn:disabled { opacity: 0.7; cursor: not-allowed; }
          .register-btn:hover:not(:disabled) { background: linear-gradient(90deg, #764ba2 0%, #6c5ce7 100%); transform: scale(1.04); }
          .register-error { color: #d63031; margin-top: 10px; text-align: center; font-weight: bold; letter-spacing: 0.5px; }
          .register-link { display: block; text-align: center; margin-top: 18px; color: #6c5ce7; text-decoration: none; font-weight: 500; font-size: 1rem; transition: color 0.2s; }
          .register-link:hover { color: #fdcb6e; }
        `}
      </style>
      <form className="register-card" onSubmit={handleRegister}>
        <div className="register-logo">
          <img src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png" alt="App Logo" />
          <span style={{ color: '#e4e6eb', fontWeight: 700, fontSize: '1.3rem', textShadow: '0 2px 8px #6c5ce7aa' }}>Socket Chats</span>
        </div>
        <div className="register-title">Create Account</div>
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="register-password-wrap">
          <input
            className="register-password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 chars, upper/lower/number/special)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
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
              // Eye open SVG
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6c5ce7" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#6c5ce7" strokeWidth="2"/></svg>
            ) : (
              // Eye closed SVG
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94C16.13 19.13 14.13 20 12 20c-7 0-11-8-11-8a21.91 21.91 0 0 1 5.06-6.06M9.53 9.53A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.11.91-.29 1.29M1 1l22 22" stroke="#6c5ce7" strokeWidth="2"/></svg>
            )}
          </span>
        </div>
        <input
          className="register-input"
          type="text"
          placeholder="Avatar URL (optional)"
          value={avatar}
          onChange={e => setAvatar(e.target.value)}
        />
        <button className="register-btn" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <div className="register-error">{error}</div>}
        <a className="register-link" href="/login">Already have an account? Login</a>
      </form>
    </div>
  );
}