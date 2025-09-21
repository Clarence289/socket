const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = 'your_jwt_secret'; // Use env variable in production

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://192.168.0.203',
    'http://192.168.0.203:3000'
  ],
  credentials: true
}));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// --- MESSAGE SCHEMA ---
const messageSchema = new mongoose.Schema({
  room: String,
  sender: String,
  avatar: String,
  message: String,
  image: String,
  voice: String,
  file: {
    name: String,
    url: String
  },
  timestamp: { type: Date, default: Date.now },
  private: Boolean,
  readBy: [String],
  reactions: [
    {
      reaction: String,
      user: String
    }
  ],
  _clientId: String
});
const Message = mongoose.model('Message', messageSchema);

// --- AUTHENTICATION ENDPOINTS ---
function isStrongPassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { email, password, avatar } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, avatar });
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user: { email: user.email, avatar: user.avatar }, token });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, user: { email: user.email, avatar: user.avatar }, token });
});

// --- CHAT ENDPOINTS ---

app.get('/api/messages', async (req, res) => {
  const { room, before } = req.query;
  if (!room) return res.status(400).json({ error: 'Room required' });

  let query = { room, private: false };
  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ timestamp: 1 })
    .limit(20)
    .exec();

  res.json(messages);
});

app.get('/api/search', async (req, res) => {
  const { room, q } = req.query;
  if (!room || !q) return res.status(400).json({ error: 'Room and query required' });

  const results = await Message.find({
    room,
    private: false,
    message: { $regex: q, $options: 'i' }
  }).sort({ timestamp: 1 }).exec();

  res.json(results);
});

app.delete('/api/messages/:msgId', async (req, res) => {
  const { msgId } = req.params;
  try {
    await Message.deleteOne({ _id: msgId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.put('/api/messages/:msgId', async (req, res) => {
  const { msgId } = req.params;
  const { message } = req.body;
  try {
    await Message.updateOne({ _id: msgId }, { $set: { message } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Edit failed' });
  }
});

app.post('/api/messages/read', async (req, res) => {
  const { room, email } = req.body;
  try {
    await Message.updateMany(
      { room, private: false, readBy: { $ne: email } },
      { $push: { readBy: email } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Read update failed' });
  }
});

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://192.168.0.203',
      'http://192.168.0.203:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const chatNamespace = io.of('/chat');

let users = {};
let nameToSockets = {}; // <-- changed from nameToSocket

chatNamespace.on('connection', (socket) => {
  socket.on('user_join', ({ name, room, avatar }) => {
    users[socket.id] = { name, room, avatar };
    if (!nameToSockets[name]) nameToSockets[name] = [];
    nameToSockets[name].push(socket.id);
    socket.join(room);

    chatNamespace.to(room).emit('user_event', { type: 'join', user: name });

    const roomUsers = Object.values(users)
      .filter(u => u.room === room)
      .map(u => u.name);
    chatNamespace.to(room).emit('active_users', roomUsers);
  });

  socket.on('typing', ({ username, room, isTyping }) => {
    chatNamespace.to(room).emit('typing', { username, isTyping });
  });

  // --- REACTION SUPPORT ---
  socket.on('message_reaction', async ({ msgId, reaction, user, room }) => {
    await Message.updateOne(
      { _id: msgId },
      { $push: { reactions: { reaction, user } } }
    );
    chatNamespace.to(room).emit('message_reaction', { msgId, reaction, user });
  });

  // --- PUBLIC MESSAGE (with file support) ---
  socket.on('send_message', async (data) => {
    const user = users[socket.id];
    const sender = user?.name || 'Anonymous';
    const room = data.room || user?.room;
    const avatar = user?.avatar || data.avatar || null;

    const messageData = {
      sender,
      room,
      avatar,
      message: data.message || '',
      image: data.image || null,
      voice: data.voice || null,
      file: data.file || null,
      timestamp: new Date(),
      private: false,
      readBy: [sender],
      reactions: [],
      _clientId: data._clientId || null
    };
    await Message.create(messageData);

    chatNamespace.to(room).emit('receive_message', messageData);
    socket.emit('receive_message', messageData);

    // Push notification event for clients
    chatNamespace.to(room).emit('push_notification', {
      title: `New message from ${sender}`,
      body: messageData.message || (messageData.file ? messageData.file.name : 'Media message')
    });

    if (data._clientId) {
      socket.emit('message_ack', { _clientId: data._clientId });
    }
  });

  // --- PRIVATE MESSAGE (with file support) ---
  socket.on('private_message', async (data) => {
    const user = users[socket.id];
    const { sender, recipient, message, image, voice, file, _clientId } = data;
    const recipientSocketIds = nameToSockets[recipient] || [];
    const avatar = user?.avatar || data.avatar || null;

    const privateMessage = {
      sender,
      avatar,
      message,
      image,
      voice,
      file: file || null,
      timestamp: new Date(),
      private: true,
      room: user?.room,
      readBy: [sender],
      reactions: [],
      _clientId: _clientId || null
    };

    await Message.create(privateMessage);

    // Send to all sockets for the recipient
    for (const recipientSocketId of recipientSocketIds) {
      chatNamespace.to(recipientSocketId).emit('receive_message', privateMessage);
      chatNamespace.to(recipientSocketId).emit('push_notification', {
        title: `New private message from ${sender}`,
        body: privateMessage.message || (privateMessage.file ? privateMessage.file.name : 'Media message')
      });
    }
    socket.emit('receive_message', privateMessage);

    if (_clientId) {
      socket.emit('message_ack', { _clientId });
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      chatNamespace.to(user.room).emit('user_event', { type: 'leave', user: user.name });
      // Remove socket from nameToSockets
      if (nameToSockets[user.name]) {
        nameToSockets[user.name] = nameToSockets[user.name].filter(id => id !== socket.id);
        if (nameToSockets[user.name].length === 0) delete nameToSockets[user.name];
      }
      delete users[socket.id];
      const roomUsers = Object.values(users)
        .filter(u => u.room === user.room)
        .map(u => u.name);
      chatNamespace.to(user.room).emit('active_users', roomUsers);
    }
  });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://192.168.0.203:${PORT}`);
});