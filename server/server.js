require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

// Environment variables with validation
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Trust proxy for hosting platforms
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  }
}));

// Compression middleware
app.use(compression());

// Rate limiting - more restrictive in production
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max: NODE_ENV === 'production' ? max : max * 10,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' && req.ip === '127.0.0.1'
});

app.use('/api/auth', createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts'));
app.use('/api/upload', createRateLimit(60 * 1000, 10, 'Too many file uploads'));
app.use('/api', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Enhanced CORS configuration for local network + production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  // Local development origins
  ...(NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    // Your local network IP addresses
    'http://192.168.0.203:3000',
    'http://192.168.0.203:5173',
    'http://192.168.0.203:5174',
    'http://192.168.0.203',
  ] : []),
  // Production hosting platforms
  'https://*.netlify.app',
  'https://*.vercel.app',
  'https://*.onrender.com',
  'https://*.railway.app',
  'https://*.fly.dev',
  'https://*.herokuapp.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*').replace(/\./g, '\\.');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.warn(`❌ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: NODE_ENV === 'production' ? '7d' : '0',
  setHeaders: (res, path, stat) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Enhanced file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const sanitizedName = file.fieldname.replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `${sanitizedName}-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: NODE_ENV === 'production' ? 10 * 1024 * 1024 : 50 * 1024 * 1024, // 10MB prod, 50MB dev
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4|avi|mov|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and media files are allowed.'));
    }
  }
});

// Enhanced MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    if (NODE_ENV === 'test') {
      console.log('Test environment - skipping MongoDB connection');
      return;
    }
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      if (retries > 0) {
        console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
        setTimeout(() => connectDB(retries - 1), 5000);
      }
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (retries > 0) {
      console.log(`Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Utility functions
function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

// JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
}

// Request logging (only in development)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chat App Server is running!',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: statusMap[mongoStatus] || 'unknown',
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    version: '1.0.0',
    memory: process.memoryUsage()
  });
});

// Enhanced authentication endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, avatar } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const sanitizedEmail = sanitizeInput(email);
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.' 
      });
    }

    const existingUser = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = await User.create({ 
      email: sanitizedEmail.toLowerCase(), 
      password: hashedPassword, 
      avatar: sanitizeInput(avatar) || null 
    });
    
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user: { 
        id: user._id,
        email: user.email, 
        avatar: user.avatar,
        createdAt: user.createdAt
      }, 
      token 
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const sanitizedEmail = sanitizeInput(email);
    
    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { 
        id: user._id,
        email: user.email, 
        avatar: user.avatar,
        createdAt: user.createdAt
      }, 
      token 
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Enhanced file upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Dynamic URL generation for local vs production
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = process.env.SERVER_URL || 
      (NODE_ENV === 'production' ? `${protocol}://${host}` : `http://192.168.0.203:${PORT}`);
    
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        url: fileUrl,
        type: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Maximum size is ${NODE_ENV === 'production' ? '10MB' : '50MB'}.` });
    }
    
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

// Enhanced chat endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const { room, before, limit = 20 } = req.query;
    
    if (!room) {
      return res.status(400).json({ error: 'Room parameter is required' });
    }

    const sanitizedRoom = sanitizeInput(room);
    let query = { room: sanitizedRoom, private: false };
    
    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      query.timestamp = { $lt: beforeDate };
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .lean()
      .exec();

    res.json({
      success: true,
      messages: messages.reverse(),
      count: messages.length
    });
    
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { room, q, limit = 20 } = req.query;
    
    if (!room || !q) {
      return res.status(400).json({ error: 'Room and query parameters are required' });
    }

    const sanitizedRoom = sanitizeInput(room);
    const sanitizedQuery = sanitizeInput(q);

    if (sanitizedQuery.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    const results = await Message.find({
      room: sanitizedRoom,
      private: false,
      message: { $regex: sanitizedQuery, $options: 'i' }
    })
    .sort({ timestamp: -1 })
    .limit(parsedLimit)
    .lean()
    .exec();

    res.json({
      success: true,
      results,
      count: results.length,
      query: sanitizedQuery
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Enhanced Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '.*').replace(/\./g, '\\.');
          return new RegExp(`^${pattern}$`).test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: NODE_ENV === 'production' ? 5e6 : 1e8, // 5MB prod, 100MB dev
  pingTimeout: 60000,
  pingInterval: 25000,
});

const chatNamespace = io.of('/chat');

// In-memory storage for connected users
let users = {};
let nameToSockets = {};

chatNamespace.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('user_join', ({ name, room, avatar }) => {
    try {
      const sanitizedName = sanitizeInput(name);
      const sanitizedRoom = sanitizeInput(room);
      const sanitizedAvatar = sanitizeInput(avatar);

      users[socket.id] = { 
        name: sanitizedName, 
        room: sanitizedRoom, 
        avatar: sanitizedAvatar, 
        joinedAt: new Date() 
      };
      
      if (!nameToSockets[sanitizedName]) nameToSockets[sanitizedName] = [];
      nameToSockets[sanitizedName].push(socket.id);
      
      socket.join(sanitizedRoom);

      socket.to(sanitizedRoom).emit('user_event', { 
        type: 'join', 
        user: sanitizedName, 
        timestamp: new Date() 
      });

      const roomUsers = Object.values(users)
        .filter(u => u.room === sanitizedRoom)
        .map(u => ({ 
          name: u.name, 
          avatar: u.avatar,
          joinedAt: u.joinedAt
        }));
      
      chatNamespace.to(sanitizedRoom).emit('active_users', roomUsers);
      
      console.log(`User ${sanitizedName} joined room ${sanitizedRoom}`);
    } catch (error) {
      console.error('Error in user_join:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('typing', ({ username, room, isTyping }) => {
    try {
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedRoom = sanitizeInput(room);
      
      socket.to(sanitizedRoom).emit('typing', { 
        username: sanitizedUsername, 
        isTyping: Boolean(isTyping), 
        timestamp: new Date() 
      });
    } catch (error) {
      console.error('Error in typing:', error);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const user = users[socket.id];
      const sender = user?.name || 'Anonymous';
      const room = sanitizeInput(data.room) || user?.room;
      const avatar = user?.avatar || sanitizeInput(data.avatar) || null;

      if (!room) {
        socket.emit('message_error', { error: 'Room is required' });
        return;
      }

      if (!data.message && !data.image && !data.voice && !data.file) {
        socket.emit('message_error', { error: 'Message content is required' });
        return;
      }

      const messageData = {
        sender,
        room,
        avatar,
        message: sanitizeInput(data.message) || '',
        image: data.image || null,
        voice: data.voice || null,
        file: data.file || null,
        timestamp: new Date(),
        private: false,
        readBy: [sender],
        reactions: []
      };

      const savedMessage = await Message.create(messageData);
      messageData._id = savedMessage._id;

      chatNamespace.to(room).emit('receive_message', messageData);

      socket.emit('message_sent', { 
        messageId: savedMessage._id,
        timestamp: messageData.timestamp
      });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
    
    try {
      const user = users[socket.id];
      if (user) {
        socket.to(user.room).emit('user_event', { 
          type: 'leave', 
          user: user.name,
          timestamp: new Date()
        });
        
        if (nameToSockets[user.name]) {
          nameToSockets[user.name] = nameToSockets[user.name].filter(id => id !== socket.id);
          if (nameToSockets[user.name].length === 0) {
            delete nameToSockets[user.name];
          }
        }
        
        delete users[socket.id];
        
        const roomUsers = Object.values(users)
          .filter(u => u.room === user.room)
          .map(u => ({ 
            name: u.name, 
            avatar: u.avatar,
            joinedAt: u.joinedAt
          }));
        
        chatNamespace.to(user.room).emit('active_users', roomUsers);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON data' });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🔄 Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
if (NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ===================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    
    if (NODE_ENV === 'development') {
      console.log(`🏠 Local access: http://192.168.0.203:${PORT}`);
      console.log(`📡 Health check: http://192.168.0.203:${PORT}/api/health`);
    }
    
    console.log('🚀 ===================================');
  });
}

module.exports = { app, server };