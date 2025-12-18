import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Join from './components/Join/Join';
import Chat from './components/Chat/Chat';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // 🚀 ENHANCED: Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking existing authentication...');
        
        // Check multiple storage keys for backward compatibility
        const storedUser = localStorage.getItem('chat_user') || localStorage.getItem('user_data');
        const storedToken = localStorage.getItem('chat_token') || localStorage.getItem('auth_token');
        const storedJoined = localStorage.getItem('chat_joined');
        
        if (storedUser && storedToken) {
          try {
            const userData = JSON.parse(storedUser);
            const joinedState = storedJoined ? JSON.parse(storedJoined) : false;
            
            // Validate user data structure
            if (userData && (userData.email || userData.id)) {
              setUser(userData);
              setJoined(joinedState);
              console.log('✅ User session restored:', userData);
              console.log('✅ Join state restored:', joinedState);
            } else {
              throw new Error('Invalid user data structure');
            }
          } catch (parseError) {
            console.error('❌ Error parsing stored user data:', parseError);
            clearAuthData();
          }
        } else {
          console.log('ℹ️ No existing authentication found');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // 🔧 Helper function to clear all auth data
  const clearAuthData = () => {
    console.log('🧹 Clearing authentication data...');
    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_joined');
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_name');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setJoined(false);
  };

  // 🚀 ENHANCED: Handle user login with better data persistence
  const handleLogin = (userData) => {
    console.log('✅ Processing login for user:', userData);
    
    setUser(userData);
    setJoined(false); // Reset joined state on new login
    
    // Store user data with multiple keys for compatibility
    localStorage.setItem('chat_user', JSON.stringify(userData));
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('chat_joined', JSON.stringify(false));
    
    // Store additional user info
    if (userData.email) {
      localStorage.setItem('chat_name', userData.email);
    }
    
    console.log('✅ User login completed and persisted');
  };

  // 🚀 ENHANCED: Handle user registration (redirect to login or auto-login)
  const handleRegister = (userData) => {
    console.log('✅ Registration completed for:', userData);
    // Note: Most apps redirect to login after registration
    // If your backend auto-logs in after registration, use handleLogin instead
  };

  // 🚀 ENHANCED: Handle logout with complete cleanup
  const handleLogout = () => {
    console.log('👋 User logging out...');
    clearAuthData();
    
    // Force page refresh to clear any cached data
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  // 🚀 ENHANCED: Handle joining chat room
  const handleJoin = (roomData) => {
    console.log('🚪 User joining chat:', roomData);
    setJoined(true);
    localStorage.setItem('chat_joined', JSON.stringify(true));
    
    // Store room info if provided
    if (roomData) {
      localStorage.setItem('chat_room_data', JSON.stringify(roomData));
    }
  };

  // 🚀 ENHANCED: Handle leaving chat room
  const handleLeave = () => {
    console.log('🚪 User leaving chat...');
    setJoined(false);
    localStorage.setItem('chat_joined', JSON.stringify(false));
    localStorage.removeItem('chat_room_data');
  };

  // 🎨 Loading screen component
  const LoadingScreen = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e4e6eb',
      fontSize: '1.2rem',
      animation: 'fadeIn 0.5s ease'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .loading-spinner {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}
      </style>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          filter: 'drop-shadow(0 2px 8px #6c5ce7aa)'
        }}>
          🔄
        </div>
        <div style={{ 
          fontWeight: 600, 
          letterSpacing: '1px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Loading Socket Chat...
        </div>
        <div style={{ 
          fontSize: '0.9rem', 
          marginTop: '0.5rem', 
          opacity: 0.7 
        }}>
          Checking authentication...
        </div>
      </div>
    </div>
  );

  // Show loading screen while checking authentication
  if (loading || !authChecked) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 🔐 Authentication Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/join" replace /> : <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/join" replace /> : <Register onRegister={handleRegister} />
            } 
          />
          
          {/* 🚪 Join Room Route */}
          <Route
            path="/join"
            element={
              user ? (
                joined ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <Join 
                    user={user}
                    onJoin={handleJoin} 
                    onLogout={handleLogout} 
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* 💬 Chat Route */}
          <Route
            path="/chat"
            element={
              user ? (
                joined ? (
                  <Chat 
                    user={user} 
                    onLogout={handleLogout} 
                    onLeave={handleLeave} 
                  />
                ) : (
                  <Navigate to="/join" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* 🏠 Default Route */}
          <Route
            path="/"
            element={
              user ? (
                joined ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <Navigate to="/join" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* 🔄 Catch All Route */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;