import express from 'express';
import Startup from '../models/Startup.js';

const router = express.Router();

// @route   GET /api/pitches
// @desc    Get all startup pitches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const pitches = await Startup.find({}).select('-password');
    res.json(pitches);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pitches/:id
// @desc    Get single startup pitch by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pitch = await Startup.findById(req.params.id).select('-password');
    
    if (!pitch) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    
    res.json(pitch);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
