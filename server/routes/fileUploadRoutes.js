import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
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

// @route   POST /api/upload
// @desc    Upload a PDF or image file
// @access  Public
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Get additional data from request body
    const { userId, documentType, description } = req.body;

    // In a real application, you would save file info to database here
    // For example:
    // const document = await Document.create({
    //   userId,
    //   documentType,
    //   fileName: req.file.filename,
    //   originalName: req.file.originalname,
    //   mimeType: req.file.mimetype,
    //   size: req.file.size,
    //   path: req.file.path
    // });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        userId: userId || null,
        documentType: documentType || null,
        description: description || null,
        uploadDate: new Date()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload',
      error: error.message 
    });
  }
});

// @route   GET /api/files/:filename
// @desc    Serve uploaded files
// @access  Public
router.get('/files/:filename', (req, res) => {
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