import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Join from './components/Join/Join';
import Chat from './components/Chat/Chat';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

const App = () => {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('chat_user')) || null
  );
  const [joined, setJoined] = useState(
    () => JSON.parse(localStorage.getItem('chat_joined')) || false
  );

  // Save user to localStorage for persistence
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chat_user', JSON.stringify(userData));
    setJoined(false); // Reset joined state on new login
    localStorage.setItem('chat_joined', JSON.stringify(false));
  };

  const handleLogout = () => {
    setUser(null);
    setJoined(false);
    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_joined');
  };

  const handleJoin = () => {
    setJoined(true);
    localStorage.setItem('chat_joined', JSON.stringify(true));
  };

  // Add this function for Back button in Chat
  const handleLeave = () => {
    setJoined(false);
    localStorage.setItem('chat_joined', JSON.stringify(false));
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onRegister={handleLogin} />} />
        <Route
          path="/join"
          element={
            user
              ? joined
                ? <Navigate to="/chat" />
                : <Join onJoin={handleJoin} onLogout={handleLogout} />
              : <Navigate to="/register" />
          }
        />
        <Route
          path="/chat"
          element={
            user
              ? joined
                ? <Chat user={user} onLogout={handleLogout} onLeave={handleLeave} />
                : <Navigate to="/join" />
              : <Navigate to="/register" />
          }
        />
        <Route
          path="/"
          element={
            user
              ? joined
                ? <Navigate to="/chat" />
                : <Navigate to="/join" />
              : <Navigate to="/register" />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;