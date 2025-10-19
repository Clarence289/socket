import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const defaultRooms = ['General', 'Sports', 'Tech', 'Random', 'Gaming', 'Music'];
const avatarList = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Lion',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Fox',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Tiger',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Wolf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bear',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cat',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Dragon',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Eagle',
];

const getStoredAvatar = () => {
  const stored = localStorage.getItem('avatar');
  return stored ? stored : avatarList[0];
};

const getStoredName = () => {
  return localStorage.getItem('chat_name') || '';
};

const JoinRoom = ({ onJoin, onLogout }) => {
  const [name, setName] = useState(getStoredName());
  const [room, setRoom] = useState(defaultRooms[0]);
  const [customRoom, setCustomRoom] = useState('');
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(getStoredAvatar());
  const [isCustomAvatar, setIsCustomAvatar] = useState(!!localStorage.getItem('avatarFile'));
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Auto-focus name input if empty
  useEffect(() => {
    if (!name) {
      document.querySelector('.join-input')?.focus();
    }
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    const finalRoom = customRoom.trim() ? customRoom.trim() : room;
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 30) {
      setError('Name must be less than 30 characters.');
      return;
    }
    if (!finalRoom) {
      setError('Please select or create a room.');
      return;
    }
    if (finalRoom.length > 50) {
      setError('Room name must be less than 50 characters.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    console.log(`🚀 Joining room: ${finalRoom} as ${trimmedName}`);
    
    // Save to localStorage
    localStorage.setItem('chat_name', trimmedName);
    localStorage.setItem('chat_room', finalRoom);
    localStorage.setItem('chat_avatar', avatar);
    
    if (typeof onJoin === 'function') onJoin();
    
    // Simulate loading for better UX
    setTimeout(() => {
      setLoading(false);
      navigate(`/chat?name=${encodeURIComponent(trimmedName)}&room=${encodeURIComponent(finalRoom)}&avatar=${encodeURIComponent(avatar)}`);
    }, 500);
  };

  const randomAvatar = () => {
    setIsCustomAvatar(false);
    localStorage.removeItem('avatarFile');
    const idx = Math.floor(Math.random() * avatarList.length);
    const newAvatar = avatarList[idx];
    setAvatar(newAvatar);
    localStorage.setItem('avatar', newAvatar);
    console.log('🎲 Random avatar selected');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    setImageLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setIsCustomAvatar(true);
      localStorage.setItem('avatar', reader.result);
      localStorage.setItem('avatarFile', '1');
      setImageLoading(false);
      console.log('📷 Custom avatar uploaded');
    };
    reader.onerror = () => {
      setError('Failed to load image');
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setAvatar(avatarList[0]);
    setIsCustomAvatar(false);
    localStorage.removeItem('avatarFile');
    localStorage.setItem('avatar', avatarList[0]);
    console.log('🗑️ Custom avatar deleted');
  };

  const handleLogoutClick = () => {
    console.log('👋 User logging out from join page');
    if (onLogout) onLogout();
    navigate('/register');
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('chat_user'));
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  return (
    <div className="join-container" style={{ 
      fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="join-box" style={{ 
        width: '100%', 
        maxWidth: 400, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'rgba(36,37,38,0.95)',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 8px 32px rgba(44,62,80,0.18)',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        
        {/* Header with user info and logout */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          {currentUser && (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#b2bec3',
              background: 'rgba(116, 75, 162, 0.1)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(116, 75, 162, 0.3)'
            }}>
              👤 {currentUser.email}
            </div>
          )}
          <button
            onClick={handleLogoutClick}
            style={{
              background: 'linear-gradient(90deg,#e53e3e,#fdcb6e)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #e53e3e44',
              fontSize: '0.9rem',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Logout
          </button>
        </div>

        <h2 className="animated-title" style={{
          textAlign: 'center',
          width: '100%',
          marginBottom: 24,
          fontWeight: 700,
          fontSize: '2.2rem',
          letterSpacing: '1px',
          color: '#e4e6eb'
        }}>
          🚀 Welcome to{' '}
          <span style={{
            background: 'linear-gradient(90deg,#667eea,#f7971e,#764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '2.3rem'
          }}>
            Socket Chat
          </span>
        </h2>
        
        {/* Avatar Section */}
        <div className="avatar-preview" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatar}
              alt="avatar"
              className="avatar-img"
              style={{
                border: '3px solid #764ba2',
                background: '#fff',
                boxShadow: '0 0 0 6px #764ba244, 0 4px 16px #667eea33',
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 12,
                transition: 'transform 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            />
            {imageLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.5rem'
              }}>
                🔄
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="avatar-random-btn"
              title="Random Avatar"
              onClick={randomAvatar}
              disabled={imageLoading}
              style={{
                fontSize: '1.3rem',
                borderRadius: '50%',
                border: '2px solid #764ba2',
                background: '#fff',
                width: 38,
                height: 38,
                boxShadow: '0 2px 8px #764ba244',
                cursor: imageLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                opacity: imageLoading ? 0.6 : 1
              }}
              onMouseOver={(e) => !imageLoading && (e.target.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🎲
            </button>
            <button
              type="button"
              className="avatar-random-btn"
              title="Upload Image"
              onClick={() => fileInputRef.current.click()}
              disabled={imageLoading}
              style={{
                fontSize: '1.3rem',
                borderRadius: '50%',
                border: '2px solid #764ba2',
                background: '#fff',
                width: 38,
                height: 38,
                boxShadow: '0 2px 8px #764ba244',
                cursor: imageLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                opacity: imageLoading ? 0.6 : 1
              }}
              onMouseOver={(e) => !imageLoading && (e.target.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              📷
            </button>
            {isCustomAvatar && (
              <button
                type="button"
                className="avatar-random-btn"
                title="Delete Avatar"
                onClick={handleDeleteAvatar}
                disabled={imageLoading}
                style={{
                  fontSize: '1.3rem',
                  borderRadius: '50%',
                  border: '2px solid #e53e3e',
                  background: '#fff',
                  width: 38,
                  height: 38,
                  boxShadow: '0 2px 8px #e53e3e44',
                  cursor: imageLoading ? 'not-allowed' : 'pointer',
                  color: '#e53e3e',
                  transition: 'transform 0.2s',
                  opacity: imageLoading ? 0.6 : 1
                }}
                onMouseOver={(e) => !imageLoading && (e.target.style.transform = 'scale(1.1)')}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                ❌
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
        </div>
        
        {error && (
          <div className="join-error" style={{ 
            textAlign: 'center', 
            color: '#ff6b6b', 
            fontWeight: 'bold',
            background: 'rgba(255, 107, 107, 0.1)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            marginBottom: 16,
            width: '100%'
          }}>
            ❌ {error}
          </div>
        )}
        
        <form onSubmit={handleJoin} style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0
        }}>
          <input
            className="join-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            required
            autoFocus={!name}
            disabled={loading}
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              letterSpacing: '0.5px',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%',
              background: '#292b2f',
              color: '#e4e6eb',
              border: '1px solid #3a3b3c',
              borderRadius: '10px',
              padding: '12px 14px',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
            onBlur={(e) => e.target.style.borderColor = '#3a3b3c'}
          />
          
          <select
            className="join-input"
            value={room}
            onChange={e => setRoom(e.target.value)}
            disabled={loading}
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              background: '#292b2f',
              color: '#e4e6eb',
              border: '1px solid #3a3b3c',
              borderRadius: '10px',
              padding: '12px 14px',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            {defaultRooms.map(r => (
              <option key={r} value={r} style={{ background: '#292b2f', color: '#e4e6eb' }}>
                {r}
              </option>
            ))}
          </select>
          
          <input
            className="join-input"
            type="text"
            value={customRoom}
            onChange={e => setCustomRoom(e.target.value)}
            placeholder="Or create a new room"
            disabled={loading}
            style={{
              fontWeight: 500,
              fontSize: '1.1rem',
              textAlign: 'center',
              marginBottom: 16,
              width: '100%',
              background: '#292b2f',
              color: '#e4e6eb',
              border: '1px solid #3a3b3c',
              borderRadius: '10px',
              padding: '12px 14px',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
            onBlur={(e) => e.target.style.borderColor = '#3a3b3c'}
          />
          
          <button
            className="join-button"
            type="submit"
            disabled={loading || !name.trim() || !(room || customRoom.trim()) || imageLoading}
            style={{
              marginTop: 18,
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '1px',
              boxShadow: '0 4px 16px #764ba244',
              width: '100%',
              opacity: (loading || !name.trim() || !(room || customRoom.trim()) || imageLoading) ? 0.6 : 1,
              cursor: (loading || !name.trim() || !(room || customRoom.trim()) || imageLoading) ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(90deg, #6c5ce7 60%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.background = 'linear-gradient(90deg, #764ba2 0%, #6c5ce7 100%)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = 'linear-gradient(90deg, #6c5ce7 60%, #764ba2 100%)';
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span>🔄</span> Joining...
              </span>
            ) : (
              'Join Chat'
            )}
          </button>
        </form>
        
        <div style={{
          marginTop: 24,
          fontSize: '0.95rem',
          color: '#b2bec3',
          textAlign: 'center',
          opacity: 0.85,
          animation: 'fade-in 1.5s cubic-bezier(.39,.575,.565,1) both'
        }}>
          <span role="img" aria-label="sparkles">✨</span>
          Fast, secure & real-time chat experience!
        </div>
        
        {/* Connection Status */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: 16,
            padding: '6px 12px',
            background: 'rgba(116, 75, 162, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(116, 75, 162, 0.3)',
            fontSize: '0.8em',
            color: '#b2bec3',
            textAlign: 'center'
          }}>
            🔧 Development Mode
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default JoinRoom;