import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import queryString from 'query-string';
import EmojiPicker from 'emoji-picker-react';
import './Chat.css';

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3";
const NAMESPACE = '/chat';
const API_URL = 'http://192.168.0.203:5000';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

function TypingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

const Chat = ({ onLeave }) => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = queryString.parse(search);
  const name = params.name || localStorage.getItem('chat_name');
  const room = params.room || localStorage.getItem('chat_room');
  const avatar = params.avatar || localStorage.getItem('chat_avatar');

  useEffect(() => {
    if (!name || !room) {
      navigate('/');
    }
  }, [name, room, navigate]);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [typingUser, setTypingUser] = useState('');
  const [isSenderTyping, setIsSenderTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [fileType, setFileType] = useState('');
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const firstMessageRef = useRef(null);
  const socketRef = useRef();
  const longPressTimerRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages?room=${room}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {}
    };
    fetchMessages();
  }, [room]);

  useEffect(() => {
    const setInteracted = () => setUserInteracted(true);
    window.addEventListener('click', setInteracted, { once: true });
    window.addEventListener('keydown', setInteracted, { once: true });
    return () => {
      window.removeEventListener('click', setInteracted);
      window.removeEventListener('keydown', setInteracted);
    };
  }, []);

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    socketRef.current = io(API_URL + NAMESPACE, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;
    socket.emit('user_join', { name, room, avatar });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('receive_message', (data) => {
      setPendingMessages(prev => prev.filter(pm => pm._clientId !== data._clientId));
      setMessages((prev) => [
        ...prev.filter(m => m._clientId !== data._clientId),
        data
      ]);
      if (userInteracted && data.sender !== name) {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(() => {});
      }
      if (Notification.permission === 'granted' && data.sender !== name) {
        new Notification(`New message from ${data.sender}`, { body: data.message || (data.file ? data.file.name : 'Media message') });
      }
      if (document.hidden) setUnreadCount(c => c + 1);
    });

    socket.on('push_notification', ({ title, body }) => {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    });

    socket.on('typing', (data) => {
      if (data.username !== name && data.isTyping) {
        setTypingUser(data.username);
      } else if (data.username === name && data.isTyping) {
        setIsSenderTyping(true);
      } else if (data.username === name && !data.isTyping) {
        setIsSenderTyping(false);
      } else if (!data.isTyping) {
        setTypingUser('');
      }
    });

    socket.on('active_users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user_event', (data) => {
      if (Notification.permission === 'granted') {
        if (data.type === 'join') {
          new Notification('User joined', { body: `${data.user} joined the room.` });
        }
        if (data.type === 'leave') {
          new Notification('User left', { body: `${data.user} left the room.` });
        }
      }
      if (userInteracted) {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(() => {});
      }
    });

    socket.on('message_ack', (ack) => {
      setPendingMessages(prev => prev.filter(pm => pm._clientId !== ack._clientId));
    });

    // Listen for reactions
    socket.on('message_reaction', ({ msgId, reaction, user }) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === msgId
            ? {
                ...m,
                reactions: [
                  ...(m.reactions || []),
                  { reaction, user }
                ]
              }
            : m
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [name, room, avatar, userInteracted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const handleFocus = async () => {
      setUnreadCount(0);
      await fetch(`${API_URL}/api/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, username: name }),
      });
      const res = await fetch(`${API_URL}/api/messages?room=${room}`);
      const data = await res.json();
      setMessages([
        ...data,
        ...pendingMessages.filter(pm => !data.some(m => m._clientId === pm._clientId))
      ]);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [messages, room, name, pendingMessages]);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) New messages`;
    } else {
      document.title = `Chat Room - ${room}`;
    }
  }, [unreadCount, room]);

  const loadOlderMessages = async () => {
    if (messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].timestamp;
    try {
      const res = await fetch(`${API_URL}/api/messages?room=${room}&before=${encodeURIComponent(oldest)}`);
      const data = await res.json();
      if (data.length === 0) setHasMore(false);
      setMessages(prev => [...data, ...prev]);
      setTimeout(() => {
        firstMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {}
    setLoadingOlder(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert('Audio recording not supported in this browser.');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new window.MediaRecorder(stream);
    setMediaRecorder(recorder);
    setAudioChunks([]);
    setRecordingTime(0);
    recorder.start();
    setRecording(true);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    recorder.ondataavailable = (e) => {
      setAudioChunks((prev) => [...prev, e.data]);
    };

    recorder.onstop = () => {
      clearInterval(recordingIntervalRef.current);
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage('', null, reader.result, true);
      };
      reader.readAsDataURL(audioBlob);
      setRecording(false);
      setMediaRecorder(null);
      setAudioChunks([]);
      setRecordingTime(0);
    };
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    clearInterval(recordingIntervalRef.current);
  };

  const handleDeleteMessage = async (msgId) => {
    if (!msgId) return;
    try {
      await fetch(`${API_URL}/api/messages/${msgId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m._id !== msgId));
      setHighlightedMsgId(null);
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  const handleEditMessage = async (msgId, newText) => {
    if (!msgId) return;
    try {
      await fetch(`${API_URL}/api/messages/${msgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newText }),
      });
      setMessages(prev =>
        prev.map(m => m._id === msgId ? { ...m, message: newText } : m)
      );
      setEditingMsgId(null);
    } catch (err) {
      alert('Failed to edit message');
    }
  };

  // Send reaction
  const sendReaction = (msgId, reaction) => {
    socketRef.current.emit('message_reaction', {
      msgId,
      reaction,
      user: name,
      room
    });
    setHighlightedMsgId(null);
  };

  // Send message (support file upload)
  const sendMessage = (msg = message, img = null, voice = null, fromVoice = false, file = null) => {
    if (msg || img || voice || file) {
      const _clientId = Date.now() + Math.random().toString(36).substr(2, 9);
      if (recipient) {
        const msgData = {
          sender: name,
          recipient,
          message: msg,
          image: img ? null : null,
          voice: voice || null,
          file: file ? null : null,
          _clientId
        };
        if (img) {
          const reader = new FileReader();
          reader.onloadend = () => {
            socketRef.current.emit('private_message', { ...msgData, image: reader.result });
            setPendingMessages(prev => [...prev, { ...msgData, image: reader.result }]);
            setMessage('');
          };
          reader.readAsDataURL(img);
          return;
        }
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            socketRef.current.emit('private_message', { ...msgData, file: { name: file.name, url: reader.result } });
            setPendingMessages(prev => [...prev, { ...msgData, file: { name: file.name, url: reader.result } }]);
            setMessage('');
          };
          reader.readAsDataURL(file);
          return;
        }
        socketRef.current.emit('private_message', msgData);
        setPendingMessages(prev => [...prev, msgData]);
        setMessage('');
      } else {
        if (img) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const msgData = {
              sender: name,
              room,
              message: msg,
              image: reader.result,
              voice: null,
              file: null,
              timestamp: new Date().toISOString(),
              _clientId
            };
            socketRef.current.emit('send_message', msgData);
            setPendingMessages(prev => [...prev, msgData]);
            setMessage('');
          };
          reader.readAsDataURL(img);
          return;
        }
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const msgData = {
              sender: name,
              room,
              message: msg,
              image: null,
              voice: null,
              file: { name: file.name, url: reader.result },
              timestamp: new Date().toISOString(),
              _clientId
            };
            socketRef.current.emit('send_message', msgData);
            setPendingMessages(prev => [...prev, msgData]);
            setMessage('');
          };
          reader.readAsDataURL(file);
          return;
        }
        if (voice) {
          const msgData = {
            sender: name,
            room,
            message: msg,
            image: null,
            voice: voice,
            file: null,
            timestamp: new Date().toISOString(),
            _clientId
          };
          socketRef.current.emit('send_message', msgData);
          setPendingMessages(prev => [...prev, msgData]);
          if (fromVoice) setMessage('');
          return;
        }
        if (msg) {
          const msgData = {
            sender: name,
            room,
            message: msg,
            image: null,
            voice: null,
            file: null,
            timestamp: new Date().toISOString(),
            _clientId
          };
          socketRef.current.emit('send_message', msgData);
          setPendingMessages(prev => [...prev, msgData]);
          setMessage('');
        }
      }
    }
    socketRef.current.emit('typing', { username: name, room, isTyping: false });
    setIsSenderTyping(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const res = await fetch(`${API_URL}/api/search?room=${room}&q=${encodeURIComponent(searchTerm)}`);
    const data = await res.json();
    setSearchResults(data);
  };

  const handleBack = () => {
    if (onLeave) onLeave();
    navigate('/join');
  };

  return (
    <div className="chat-container">
      {!isConnected && (
        <div style={{ background: '#ffeaa7', color: '#d35400', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          Disconnected. Trying to reconnect...
        </div>
      )}
      {isReconnecting && isConnected && (
        <div style={{ background: '#dfe6e9', color: '#636e72', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
          Reconnecting...
        </div>
      )}
      <div className="chat-box">
        <span className="emoji-bg emoji1">💬</span>
        <span className="emoji-bg emoji2">✨</span>
        <span className="emoji-bg emoji3">🚀</span>
        <span className="emoji-bg emoji4">😃</span>
        <span className="emoji-bg emoji5">🎉</span>
        {showEmojiPicker && (
          <div className="emoji-picker-popup">
            <button
              className="emoji-close-btn"
              aria-label="Close emoji picker"
              onClick={() => setShowEmojiPicker(false)}
            >
              ✖
            </button>
            <EmojiPicker
              onEmojiClick={(emojiData) => setMessage(message + emojiData.emoji)}
              theme="light"
              width={320}
            />
          </div>
        )}
        <button className="send-button" onClick={handleBack}>⬅ Back</button>
        <h2>Room: {room}</h2>
        <form onSubmit={handleSearch} style={{ margin: '10px 0', display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #b2bec3', flex: 1 }}
          />
          <button type="submit" className="send-button" style={{ padding: '6px 16px', borderRadius: 8 }}>
            Search
          </button>
        </form>
        {searchResults.length > 0 && (
          <div style={{ marginBottom: 12, background: '#dfe6e9', borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Search Results:</div>
            {searchResults.map((msg, i) => (
              <div key={i} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #b2bec3' }}>
                <span style={{ fontWeight: 'bold', color: '#0984e3' }}>{msg.sender}</span>: {msg.message}
                <span style={{ marginLeft: 8, color: '#636e72', fontSize: '0.9em' }}>
                  {msg.timestamp && new Date(msg.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
            <button
              className="send-button"
              style={{ marginTop: 10 }}
              onClick={() => setSearchResults([])}
            >
              Back to Chat
            </button>
          </div>
        )}
        <div style={{
          margin: '10px 0 10px 0',
          padding: '6px 16px',
          background: '#f1f2f6',
          borderRadius: '12px',
          color: '#636e72',
          fontSize: '0.98rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <span role="img" aria-label="online">🟢</span>
          Online: {onlineUsers.map(u => (
            <span key={u} style={{
              color: u === name ? '#6c5ce7' : '#636e72',
              fontWeight: u === name ? 'bold' : 'normal',
              marginRight: 8
            }}>
              {u}{u === name ? ' (You)' : ''}
            </span>
          ))}
        </div>
        <div style={{
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-start'
        }}>
          <label htmlFor="recipient" style={{
            marginLeft: 22,
            marginRight: 22,
            whiteSpace: 'nowrap',
            fontWeight: 400,
            fontSize: '1rem'
          }}>
            Send private message to:
          </label>
          <select
            id="recipient"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6 }}
          >
            <option value="">-- None --</option>
            {onlineUsers.filter(u => u !== name).map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {recipient && (
            <span className="private-mode-text">
              (Private mode)
            </span>
          )}
        </div>
        {/* Animated typing indicator for sender */}
        {isSenderTyping && (
          <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span role="img" aria-label="typing">💬</span>
            You are typing<TypingDots />
          </div>
        )}
        {/* Animated typing indicator for others */}
        {typingUser && (
          <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span role="img" aria-label="typing">💬</span>
            {typingUser} is typing<TypingDots />
          </div>
        )}
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </div>
        )}
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          {hasMore ? (
            <button
              className="load-older-btn"
              onClick={loadOlderMessages}
              disabled={loadingOlder}
            >
              {loadingOlder ? 'Loading...' : 'Load Older Messages'}
            </button>
          ) : (
            <span style={{ color: '#636e72', fontSize: '0.95rem' }}>No more messages</span>
          )}
        </div>
        <div className="messages" style={{
          minHeight: 0,
          flex: 1,
          width: '100%',
          overflowY: 'auto',
          padding: '20px 8px 0 8px'
        }}>
          {messages.map((msg, i) => {
            const isUser = msg.sender === name;
            const isFirst = i === 0;
            const isPending = pendingMessages.some(pm => pm._clientId === msg._clientId);
            const isHighlighted = highlightedMsgId === msg._id;
            const isEditing = editingMsgId === msg._id;

            const handleMouseDown = () => {
              longPressTimerRef.current = setTimeout(() => setHighlightedMsgId(msg._id), 600);
            };
            const handleMouseUp = () => {
              clearTimeout(longPressTimerRef.current);
            };
            const handleMouseLeave = () => {
              clearTimeout(longPressTimerRef.current);
            };

            return (
              <div
                key={i}
                className={`message ${isUser ? 'sent' : 'received'}${isHighlighted ? ' highlighted' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                  opacity: isPending ? 0.5 : 1,
                  maxWidth: '100vw',
                  background: isHighlighted ? '#ffeaa7' : undefined,
                  border: isHighlighted ? '2px solid #fdcb6e' : undefined,
                  transition: 'background 0.2s, border 0.2s'
                }}
                ref={isFirst ? firstMessageRef : null}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={msg.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=User'}
                  alt="avatar"
                  className="avatar-img"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: 10,
                    border: '2px solid #764ba2',
                    background: '#fff'
                  }}
                />
                <div className="bubble" style={{ maxWidth: '90vw', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {msg.private && (
                    <div className="private-mode-text">
                      Private message
                    </div>
                  )}
                  {isEditing ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        handleEditMessage(msg._id, editingText);
                      }}
                      style={{ marginBottom: 8 }}
                    >
                      <input
                        type="text"
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        style={{ width: '80%', padding: 4, borderRadius: 6, border: '1px solid #b2bec3' }}
                      />
                      <button type="submit" className="send-button" style={{ marginLeft: 8 }}>Save</button>
                      <button type="button" className="send-button" style={{ marginLeft: 4, background: '#636e72' }} onClick={() => setEditingMsgId(null)}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      {msg.message && <div>{msg.message}</div>}
                      {!msg.message && msg.image && (
                        <div style={{fontStyle:'italic',color:'#888',display:'flex',alignItems:'center',gap:4}}>
                          <span role="img" aria-label="image">🖼️</span> Image
                        </div>
                      )}
                      {!msg.message && msg.voice && (
                        <div style={{fontStyle:'italic',color:'#888',display:'flex',alignItems:'center',gap:4}}>
                          <span role="img" aria-label="voice">🎤</span> Voice note
                        </div>
                      )}
                      {/* File display */}
                      {msg.file && msg.file.url && (
                        <div style={{marginTop:8}}>
                          <span role="img" aria-label="file">📎</span>
                          <a href={msg.file.url} download={msg.file.name} target="_blank" rel="noopener noreferrer" style={{color:'#0984e3',textDecoration:'underline',marginLeft:4}}>
                            {msg.file.name}
                          </a>
                        </div>
                      )}
                      {msg.image && (
                        <a href={msg.image} download={`chat-image-${i}.png`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.image}
                            alt="sent"
                            className="chat-image"
                            style={{ maxWidth: '90vw', maxHeight: 120, borderRadius: 10, marginTop: 8, display: 'block', cursor: 'pointer' }}
                          />
                        </a>
                      )}
                      {msg.voice && msg.voice.startsWith('data:audio') && (
                        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
                          <span role="img" aria-label="play">🔊</span>
                          <audio controls style={{ width: '90vw', maxWidth: 240 }}>
                            <source src={msg.voice} type="audio/webm" />
                            Your browser does not support audio.
                          </audio>
                        </div>
                      )}
                      <div className="timestamp">{msg.timestamp && new Date(msg.timestamp).toLocaleString()}</div>
                      {isPending && (
                        <span style={{ color: '#fdcb6e', marginLeft: 8, fontSize: '0.9em' }}>
                          Sending...
                        </span>
                      )}
                      {isUser && msg.readBy && (
                        <span style={{ color: '#00b894', fontSize: '0.9em', marginLeft: 8 }}>
                          {msg.readBy.length === onlineUsers.length - 1 ? '✔✔ Read' : '✔ Sent'}
                        </span>
                      )}
                      {/* Show Edit for your own messages, Delete for any message, only on long press */}
                      {isHighlighted && msg._id && !isEditing && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          {isUser && (
                            <button
                              style={{
                                background: '#00b894',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 12px',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setEditingMsgId(msg._id);
                                setEditingText(msg.message);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            style={{
                              background: '#d63031',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleDeleteMessage(msg._id)}
                          >
                            Delete
                          </button>
                          {/* Reaction bar */}
                          <div style={{ display: 'flex', gap: 4 }}>
                            {REACTIONS.map(r => (
                              <button
                                key={r}
                                style={{
                                  background: '#fff',
                                  border: '1px solid #b2bec3',
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  cursor: 'pointer',
                                  fontSize: '1.2em'
                                }}
                                onClick={() => sendReaction(msg._id, r)}
                                title={`React with ${r}`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Show reactions under message */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {REACTIONS.map(r => {
                            const count = msg.reactions.filter(rx => rx.reaction === r).length;
                            return count > 0 ? (
                              <span key={r} style={{ background: '#dfe6e9', borderRadius: 8, padding: '2px 8px', fontSize: '1.1em' }}>
                                {r} {count}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {/* Input group */}
        <div
          className="input-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingBottom: 'env(safe-area-inset-bottom, 24px)',
            marginBottom: 16
          }}
        >
          <input
            className="message-input"
            type="text"
            name="chat-message"
            placeholder="Type message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socketRef.current.emit('typing', { username: name, room, isTyping: e.target.value.length > 0 });
              setIsSenderTyping(e.target.value.length > 0);
            }}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{
              flex: '1 1 auto',
              minWidth: 80,
              paddingBottom: 12,
              fontSize: '1.05em'
            }}
            autoComplete="off"
            autoCorrect="on"
            spellCheck={true}
          />
          <button
            className="icon-button"
            title="Add emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{ flex: '0 0 auto' }}
          >
            <span role="img" aria-label="emoji">😃</span>
          </button>
          {/* Image upload */}
          <input
            type="file"
            accept="image/*"
            name="chat-image"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files[0]) {
                sendMessage('', e.target.files[0], null);
                e.target.value = '';
              }
            }}
            hidden
          />
          <button className="icon-button" onClick={() => fileInputRef.current.click()} title="Send image" style={{ flex: '0 0 auto' }}>
            <span role="img" aria-label="camera">📷</span>
          </button>
          {/* File upload (PDF, docs, etc) */}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.csv,application/*"
            style={{ display: 'none' }}
            id="file-upload"
            onChange={e => {
              if (e.target.files[0]) {
                sendMessage('', null, null, false, e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            className="icon-button"
            title="Send file"
            style={{ flex: '0 0 auto' }}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <span role="img" aria-label="file">📎</span>
          </button>
          {/* Voice recording and send button */}
          {!recording ? (
            <button className="icon-button" onClick={startRecording} title="Record voice note" style={{ flex: '0 0 auto' }}>
              <span role="img" aria-label="mic">🎙️</span>
            </button>
          ) : (
            <button className="icon-button" onClick={stopRecording} style={{ color: 'red', flex: '0 0 auto' }} title="Stop recording">
              <span role="img" aria-label="stop">⏹️</span>
            </button>
          )}
          {recording && (
            <span style={{ marginLeft: 10, color: '#e17055', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto' }}>
              <span role="img" aria-label="timer">⏱️</span> {recordingTime}s
            </span>
          )}
          <button className="send-button" onClick={() => sendMessage()} style={{ flex: '0 0 auto' }}>
            <span role="img" aria-label="send">📤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;