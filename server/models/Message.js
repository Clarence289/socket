const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  image: {
    type: String,
    default: null
  },
  voice: {
    type: String,
    default: null
  },
  file: {
    name: String,
    url: String,
    type: String,
    size: Number
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  private: {
    type: Boolean,
    default: false
  },
  recipient: {
    type: String,
    trim: true
  },
  readBy: [{
    type: String,
    trim: true
  }],
  reactions: [{
    reaction: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  _clientId: {
    type: String,
    default: null
  },
  edited: { 
    type: Boolean, 
    default: false 
  },
  editedAt: {
    type: Date
  }
});

// Add indexes for better performance
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ private: 1, sender: 1, recipient: 1 });
messageSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);