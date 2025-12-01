import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  investorId: {
    type: String, // Changed from ObjectId to String to match frontend
    required: true
  },
  investorName: {
    type: String,
    required: true
  },
  investorEmail: {
    type: String,
    required: true
  },
  startupId: {
    type: String, // Changed from ObjectId to String to match frontend
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  startupEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied'],
    default: 'pending'
  },
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;