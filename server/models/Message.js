import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['startup', 'investor'],
    required: true
  },
  receiverType: {
    type: String,
    enum: ['startup', 'investor'],
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  fileType: {
    type: String
  },
  fileName: {
    type: String
  },
  filePath: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Message', MessageSchema);