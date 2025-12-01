import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Message from '../models/Message.js';
import Contact from '../models/Contact.js';
import Startup from '../models/Startup.js';
import Investor from '../models/Investor.js';

// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in the 'uploads' directory
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept all file types
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a new message
// @access  Public
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const {
      senderId,
      senderName,
      receiverId,
      receiverName,
      content,
      senderType,
      receiverType,
      conversationId,
      fileType,
      fileName
    } = req.body;

    // Generate a conversation ID if one doesn't exist
    const actualConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const messageData = {
      senderId,
      senderName,
      receiverId,
      receiverName,
      content,
      senderType,
      receiverType,
      conversationId: actualConversationId
    };

    // Add file information if a file was uploaded
    if (req.file) {
      messageData.fileType = req.file.mimetype;
      messageData.fileName = req.file.originalname;
      messageData.filePath = req.file.filename; // Store the actual filename for retrieval
    } else if (fileType && fileName) {
      // For cases where file info is sent in the body
      messageData.fileType = fileType;
      messageData.fileName = fileName;
    }

    const message = await Message.create(messageData);

    // Create or update notification for the receiver
    // Check if a contact already exists between these parties
    let contact;
    if (senderType === 'investor' && receiverType === 'startup') {
      // Investor sending to startup
      contact = await Contact.findOne({
        investorId: senderId,
        startupId: receiverId
      });
      
      // Fetch email addresses
      const investor = await Investor.findById(senderId);
      const startup = await Startup.findById(receiverId);
      
      if (!investor || !startup) {
        return res.status(404).json({ 
          success: false,
          message: 'Investor or startup not found' 
        });
      }
      
      if (!contact) {
        // Create new contact notification
        contact = await Contact.create({
          investorId: senderId,
          investorName: senderName,
          investorEmail: investor.email,
          startupId: receiverId,
          startupName: receiverName,
          startupEmail: startup.email,
          message: content || (req.file ? `📎 File attachment: ${req.file.originalname || fileName}` : 'New message'),
          conversationId: actualConversationId
        });
      } else {
        // Update existing contact with new message info
        contact.message = content || (req.file ? `📎 File attachment: ${req.file.originalname || fileName}` : 'New message');
        contact.status = 'pending'; // Mark as unread
        // Update conversationId if it was newly generated
        if (!contact.conversationId) {
          contact.conversationId = actualConversationId;
        }
        await contact.save();
      }
    } else if (senderType === 'startup' && receiverType === 'investor') {
      // Startup sending to investor
      contact = await Contact.findOne({
        investorId: receiverId,
        startupId: senderId
      });
      
      // Fetch email addresses
      const startup = await Startup.findById(senderId);
      const investor = await Investor.findById(receiverId);
      
      if (!investor || !startup) {
        return res.status(404).json({ 
          success: false,
          message: 'Investor or startup not found' 
        });
      }
      
      if (!contact) {
        // Create new contact notification
        contact = await Contact.create({
          investorId: receiverId,
          investorName: receiverName,
          investorEmail: investor.email,
          startupId: senderId,
          startupName: senderName,
          startupEmail: startup.email,
          message: content || (req.file ? `📎 File attachment: ${req.file.originalname || fileName}` : 'New message'),
          conversationId: actualConversationId
        });
      } else {
        // Update existing contact with new message info
        contact.message = content || (req.file ? `📎 File attachment: ${req.file.originalname || fileName}` : 'New message');
        contact.status = 'pending'; // Mark as unread
        // Update conversationId if it was newly generated
        if (!contact.conversationId) {
          contact.conversationId = actualConversationId;
        }
        await contact.save();
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      error: error.message 
    });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Public
router.get('/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch messages',
      error: error.message 
    });
  }
});

// @route   GET /api/messages/file/:filename
// @desc    Serve uploaded message files
// @access  Public
router.get('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
});

export default router;