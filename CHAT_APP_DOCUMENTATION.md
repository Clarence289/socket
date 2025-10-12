# Real-Time Chat Application - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Socket Events](#socket-events)
8. [Database Models](#database-models)
9. [Testing](#testing)
10. [Security Features](#security-features)
11. [File Structure](#file-structure)
12. [Interview Questions](#interview-questions)

## 🚀 Project Overview

A full-stack real-time chat application built with Node.js, Express.js, Socket.IO, and MongoDB. The application supports real-time messaging, file sharing, user authentication, and private messaging.

### Key Highlights
- **Real-time communication** using Socket.IO
- **JWT-based authentication** with secure password hashing
- **File upload support** (images, documents, media)
- **Private and public messaging**
- **Message reactions and typing indicators**
- **Comprehensive testing** with Jest
- **Cross-platform compatibility**

## 🛠 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware

### Testing & Development
- **Jest** - Testing framework
- **MongoDB Memory Server** - In-memory database for testing
- **cross-env** - Cross-platform environment variables
- **nodemon** - Development auto-restart

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│     Client      │◄──►│     Server      │◄──►│    MongoDB      │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
    Socket.IO              Express API
    Real-time              REST Endpoints
    Communication          Authentication
```

### Communication Flow
1. **HTTP Requests** - Authentication, file uploads, message history
2. **Socket.IO** - Real-time messaging, typing indicators, user presence
3. **Database** - Persistent storage for users and messages

## ✨ Features

### 🔐 Authentication System
- User registration with email validation
- Secure password requirements (8+ chars, mixed case, numbers, symbols)
- JWT token-based authentication (7-day expiration)
- Protected routes and middleware
- Profile management

### 💬 Messaging System
- **Real-time messaging** in chat rooms
- **Private direct messaging** between users
- **Message editing and deletion**
- **Message read status tracking**
- **Search functionality** across messages
- **Pagination support** for message history

### 📁 File Sharing
- **File upload** support (images, documents, media)
- **50MB file size limit**
- **Multiple file type support** (jpeg, png, pdf, doc, mp4, etc.)
- **Secure file storage** in uploads directory

### 🎯 Real-time Features
- **Typing indicators** (shows when users are typing)
- **Message reactions** (emoji reactions)
- **User presence** (online/offline status)
- **Active users list** per room
- **Push notifications** for new messages
- **Connection management** (join/leave notifications)

### 🔍 Advanced Features
- **Message acknowledgments** (delivery confirmation)
- **Client-side message IDs** for optimistic updates
- **Voice message support**
- **Image sharing**
- **Cross-platform compatibility**

## 🚀 Installation & Setup

### Prerequisites
```bash
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn
```

### 1. Clone Repository
```bash
git clone <repository-url>
cd socket/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env` file:
```env
NODE_ENV=development
PORT=5000
HOST=192.168.0.203
JWT_SECRET=your_secure_jwt_secret_here
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/chatapp
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start

# Testing
npm test
```

### 5. Verify Installation
- Server: `http://localhost:5000/api/health`
- Expected response: `{"status":"OK","mongodb":"connected"}`

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "avatar": "https://example.com/avatar.jpg" // optional
}
```

#### POST `/api/login`
User login
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

#### GET `/api/profile`
Get user profile (requires authentication)
```bash
Headers: Authorization: Bearer <jwt_token>
```

### Message Endpoints

#### GET `/api/messages`
Get public messages
```bash
Query params:
- room: string (required)
- before: ISO date (optional, for pagination)
- limit: number (optional, default: 20)
```

#### GET `/api/private-messages`
Get private messages
```bash
Query params:
- user1: string (required)
- user2: string (required)
- before: ISO date (optional)
- limit: number (optional, default: 20)
```

#### GET `/api/search`
Search messages
```bash
Query params:
- room: string (required)
- q: string (required, min 2 chars)
- limit: number (optional, default: 50)
```

#### PUT `/api/messages/:msgId`
Edit message
```json
{
  "message": "Updated message content"
}
```

#### DELETE `/api/messages/:msgId`
Delete message

#### POST `/api/messages/read`
Mark messages as read
```json
{
  "room": "general",
  "email": "user@example.com"
}
```

### File Upload

#### POST `/api/upload`
Upload file
```bash
Content-Type: multipart/form-data
Field name: file
Max size: 50MB
Allowed types: jpeg, jpg, png, gif, pdf, doc, docx, txt, mp3, mp4, avi, mov
```

### Utility Endpoints

#### GET `/api/health`
Health check
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": "connected",
  "uptime": 3600,
  "environment": "development"
}
```

## 🔌 Socket Events

### Client → Server Events

#### `user_join`
User joins a chat room
```javascript
socket.emit('user_join', {
  name: 'username',
  room: 'general',
  avatar: 'avatar_url'
});
```

#### `send_message`
Send public message
```javascript
socket.emit('send_message', {
  room: 'general',
  message: 'Hello world!',
  image: 'image_url', // optional
  voice: 'voice_url', // optional
  file: { // optional
    name: 'document.pdf',
    url: 'file_url',
    type: 'application/pdf',
    size: 1024
  },
  _clientId: 'unique_client_id' // for acknowledgment
});
```

#### `private_message`
Send private message
```javascript
socket.emit('private_message', {
  sender: 'user1',
  recipient: 'user2',
  message: 'Private message',
  _clientId: 'unique_client_id'
});
```

#### `typing`
Typing indicator
```javascript
socket.emit('typing', {
  username: 'user1',
  room: 'general',
  isTyping: true
});
```

#### `message_reaction`
Add reaction to message
```javascript
socket.emit('message_reaction', {
  msgId: 'message_id',
  reaction: '👍',
  user: 'username',
  room: 'general'
});
```

### Server → Client Events

#### `receive_message`
Receive new message
```javascript
socket.on('receive_message', (data) => {
  // Handle incoming message
});
```

#### `user_event`
User join/leave notifications
```javascript
socket.on('user_event', (data) => {
  // { type: 'join'|'leave', user: 'username', timestamp: Date }
});
```

#### `active_users`
Current active users in room
```javascript
socket.on('active_users', (users) => {
  // Array of { name, avatar, joinedAt }
});
```

#### `typing`
Typing indicator from other users
```javascript
socket.on('typing', (data) => {
  // { username, isTyping, timestamp }
});
```

#### `message_ack`
Message delivery acknowledgment
```javascript
socket.on('message_ack', (data) => {
  // { _clientId, messageId, timestamp }
});
```

#### `push_notification`
Push notification data
```javascript
socket.on('push_notification', (data) => {
  // { title, body, timestamp, private? }
});
```

#### `message_error`
Error handling
```javascript
socket.on('message_error', (error) => {
  // { error: 'Error message' }
});
```

## 🗃 Database Models

### User Model
```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

### Message Model
```javascript
{
  room: { type: String, required: true },
  sender: { type: String, required: true },
  avatar: String,
  message: { type: String, maxlength: 1000 },
  image: String,
  voice: String,
  file: {
    name: String,
    url: String,
    type: String,
    size: Number
  },
  timestamp: { type: Date, default: Date.now },
  private: { type: Boolean, default: false },
  recipient: String,
  readBy: [String],
  reactions: [{
    reaction: String,
    user: String,
    timestamp: Date
  }],
  _clientId: String,
  edited: { type: Boolean, default: false },
  editedAt: Date
}
```

## 🧪 Testing

### Test Setup
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Strategy
- **Mock-based unit testing** (no real database)
- **Jest framework** with Node.js environment
- **Cross-platform compatibility** with cross-env
- **Fast execution** (seconds, not minutes)

### Test Coverage
- ✅ User model validation
- ✅ Authentication logic
- ✅ Email format validation
- ✅ Password requirements
- ✅ Default value handling
- ✅ Error scenarios

### Sample Test
```javascript
it('should create a user with valid data', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'Password123!'
  };
  
  const user = new User(userData);
  const savedUser = await user.save();
  
  expect(savedUser.email).toBe('test@example.com');
  expect(savedUser.avatar).toBe(null);
  expect(savedUser.createdAt).toBeDefined();
});
```

## 🔒 Security Features

### Authentication Security
- **bcrypt password hashing** (12 salt rounds)
- **JWT tokens** with 7-day expiration
- **Strong password requirements** (8+ chars, mixed case, numbers, symbols)
- **Email validation** and normalization

### API Security
- **CORS configuration** for specific origins
- **Request validation** and sanitization
- **File upload restrictions** (type and size limits)
- **Protected routes** with JWT middleware
- **MongoDB injection protection**

### Input Validation
- **Email format validation**
- **Password strength checking**
- **File type restrictions**
- **Message length limits** (1000 characters)
- **Search query minimum length** (2 characters)

## 📁 File Structure

```
server/
├── models/
│   ├── User.js                 # User schema and model
│   ├── Message.js              # Message schema and model
│   └── User.test.js            # User model tests
├── uploads/                    # File storage directory
├── server.js                   # Main application file
├── package.json                # Dependencies and scripts
├── jest.config.js              # Jest testing configuration
├── setupTests.js               # Global test setup
└── basic.test.js               # Basic environment tests
```

### Key Files Description

#### `server.js` (Main Application)
- Express server setup
- Socket.IO configuration
- Authentication middleware
- API route handlers
- Database connection
- File upload handling

#### `models/User.js`
- User schema definition
- Email validation
- Password requirements
- Index configuration

#### `models/Message.js`
- Message schema definition
- File attachment support
- Reaction system
- Index optimization

#### `User.test.js`
- Comprehensive user model tests
- Mock-based testing approach
- Validation error testing

## 🎯 Interview Questions & Answers

### Architecture & Design

**Q: Explain the overall architecture of this chat application.**

**A:** The application follows a 3-tier architecture:
1. **Client Layer**: Frontend interface (React/HTML)
2. **Server Layer**: Express.js API + Socket.IO for real-time communication
3. **Database Layer**: MongoDB for persistent storage

Communication happens via two channels:
- **HTTP REST API**: Authentication, file uploads, message history
- **Socket.IO WebSocket**: Real-time messaging, typing indicators, user presence

**Q: Why did you choose Socket.IO over native WebSockets?**

**A:** Socket.IO provides several advantages:
- **Fallback mechanisms**: Automatically falls back to polling if WebSockets fail
- **Room management**: Built-in room/namespace support for chat rooms
- **Automatic reconnection**: Handles connection drops gracefully
- **Event-based communication**: Cleaner API than raw WebSocket messages
- **Broadcasting**: Easy message broadcasting to multiple clients

### Real-time Features

**Q: How do you handle typing indicators in real-time?**

**A:** Typing indicators use Socket.IO events:
1. Client emits `typing` event with `{username, room, isTyping: true}`
2. Server broadcasts to all other users in the same room
3. Client sets a timeout to automatically stop typing indicator
4. When user stops typing, emit `{isTyping: false}`

```javascript
socket.on('typing', ({ username, room, isTyping }) => {
  socket.to(room).emit('typing', { username, isTyping });
});
```

**Q: How do you ensure message delivery and handle acknowledgments?**

**A:** We implement message acknowledgments:
1. Client sends message with unique `_clientId`
2. Server saves to database and broadcasts to room
3. Server sends acknowledgment back to sender with `messageId`
4. Client can match acknowledgment to pending messages

```javascript
// Client sends
socket.emit('send_message', { message: 'Hello', _clientId: 'abc123' });

// Server acknowledges
socket.emit('message_ack', { _clientId: 'abc123', messageId: 'db_id_456' });
```

### Authentication & Security

**Q: Explain your authentication strategy.**

**A:** JWT-based authentication with multiple security layers:

1. **Registration**: 
   - Strong password validation (8+ chars, mixed case, numbers, symbols)
   - Email format validation and normalization
   - bcrypt hashing with 12 salt rounds

2. **Login**:
   - Email/password verification
   - JWT token generation (7-day expiration)
   - Secure token storage recommendations

3. **Protected Routes**:
   - JWT middleware validates tokens
   - Token expiration handling
   - User context injection

**Q: How do you handle password security?**

**A:** Multi-layered password security:
- **Client-side validation**: Initial format checking
- **Server-side validation**: Strong password regex requirements
- **bcrypt hashing**: 12 salt rounds (industry standard)
- **No plaintext storage**: Passwords are hashed before database storage
- **Secure comparison**: bcrypt.compare() for login verification

### Database & Performance

**Q: How do you optimize database queries for chat messages?**

**A:** Several optimization strategies:

1. **Indexing**:
   - Compound index on `{room: 1, timestamp: -1}` for room messages
   - Index on `{private: 1, sender: 1, recipient: 1}` for private messages
   - Timestamp index for chronological queries

2. **Pagination**:
   - Limit queries to 20 messages by default
   - Cursor-based pagination using `before` timestamp
   - Reverse chronological ordering

3. **Query Optimization**:
   - Filter by room and privacy status
   - Use MongoDB aggregation for complex queries
   - Limit field selection when possible

**Q: How do you handle file uploads efficiently?**

**A:** Multer-based file handling with security:

1. **Storage Configuration**:
   - Disk storage in `uploads/` directory
   - Unique filename generation (timestamp + random)
   - File extension preservation

2. **Security Measures**:
   - File type validation (whitelist approach)
   - 50MB size limit
   - Filename sanitization

3. **Serving Files**:
   - Express static middleware for file serving
   - Direct URL access for uploaded files
   - CORS-enabled file access

### Testing Strategy

**Q: Explain your testing approach for this application.**

**A:** Mock-based unit testing strategy:

1. **Mock Dependencies**:
   - Mongoose mocked to avoid database connections
   - Fast test execution (seconds vs minutes)
   - No external dependencies in tests

2. **Test Coverage**:
   - User model validation (email, password, defaults)
   - Authentication logic testing
   - Error scenario validation
   - Edge case handling

3. **Test Environment**:
   - Jest with Node.js environment
   - Cross-platform scripts with cross-env
   - Automated test discovery
   - Coverage reporting

**Q: Why did you choose mocking over integration tests?**

**A:** Strategic decision based on:
- **Speed**: Mocked tests run in seconds, integration tests take minutes
- **Reliability**: No network dependencies or database setup issues
- **Focus**: Unit tests validate business logic, not database connectivity
- **CI/CD**: Fast feedback loop for continuous integration
- **Development**: Faster test-driven development cycle

### Scalability & Performance

**Q: How would you scale this chat application?**

**A:** Multiple scaling strategies:

1. **Horizontal Scaling**:
   - Redis adapter for Socket.IO to enable multiple server instances
   - Load balancer for HTTP requests
   - Database sharding by room or user

2. **Caching**:
   - Redis for session storage and active user lists
   - Message caching for frequently accessed rooms
   - File CDN for media uploads

3. **Database Optimization**:
   - Read replicas for message history queries
   - Archiving old messages to separate collections
   - Database connection pooling

4. **Real-time Optimization**:
   - Room-based message broadcasting (already implemented)
   - Connection clustering with sticky sessions
   - WebSocket connection limiting per user

**Q: How do you handle connection management and cleanup?**

**A:** Comprehensive connection lifecycle management:

1. **Connection Tracking**:
   - `users` object maps socket IDs to user data
   - `nameToSockets` maps usernames to socket arrays (multiple devices)
   - Room-based user lists

2. **Cleanup on Disconnect**:
   - Remove user from active lists
   - Clean up typing indicators
   - Notify room members of user departure
   - Update active user counts

3. **Graceful Shutdown**:
   - SIGTERM/SIGINT handlers
   - Close server and database connections
   - Notify connected clients of shutdown

### Error Handling & Monitoring

**Q: How do you handle errors in real-time communication?**

**A:** Multi-layered error handling:

1. **Client-side**:
   - Connection error handling with reconnection logic
   - Message send failure detection and retry
   - User feedback for failed operations

2. **Server-side**:
   - Try-catch blocks around all Socket.IO event handlers
   - Database error handling with appropriate responses
   - Validation error messages sent back to clients

3. **Monitoring**:
   - Console logging for development
   - Health check endpoint for monitoring
   - Connection count tracking

### File System & Storage

**Q: How do you manage file uploads and storage?**

**A:** Secure file management system:

1. **Upload Process**:
   - Multer middleware for multipart/form-data handling
   - Unique filename generation to prevent conflicts
   - File type validation against whitelist

2. **Storage Structure**:
   - Local `uploads/` directory for development
   - Configurable storage location
   - Static file serving via Express

3. **Security Measures**:
   - File size limits (50MB)
   - MIME type validation
   - Path traversal prevention
   - No executable file uploads

4. **Future Enhancements**:
   - Cloud storage integration (AWS S3, Google Cloud)
   - Image compression and resizing
   - Virus scanning for uploaded files

## 🔗 Additional Resources

### Documentation Links
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Best Practices Implemented
- RESTful API design
- JWT authentication standards
- Socket.IO room management
- MongoDB indexing strategies
- Error handling patterns
- Testing methodologies

---

**Built with ❤️ using Node.js, Socket.IO, and MongoDB**

*Last updated: 30-10-2025*