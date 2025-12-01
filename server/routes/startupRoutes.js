import express from 'express';
import { body, validationResult } from 'express-validator';
import Startup from '../models/Startup.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// @route   POST /api/startup/register
// @desc    Register a new startup
// @access  Public
router.post('/register', [
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { companyName, name, email, password } = req.body;

  try {
    // Check if startup already exists
    const startupExists = await Startup.findOne({ email });
    if (startupExists) {
      return res.status(400).json({ message: 'Startup with this email already exists' });
    }

    // Create new startup
    const startup = await Startup.create({
      companyName,
      name,
      email,
      password
    });

    if (startup) {
      res.status(201).json({
        _id: startup._id,
        companyName: startup.companyName,
        name: startup.name,
        email: startup.email,
        onboardingCompleted: startup.onboardingCompleted,
        pitchCompleted: startup.pitchCompleted,
        userType: startup.userType,
        token: generateToken(startup._id, startup.userType)
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startup/login
// @desc    Login startup
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { email, password } = req.body;

  try {
    const startup = await Startup.findOne({ email });

    if (startup && (await startup.matchPassword(password))) {
      res.json({
        _id: startup._id,
        companyName: startup.companyName,
        name: startup.name,
        email: startup.email,
        onboardingCompleted: startup.onboardingCompleted,
        pitchCompleted: startup.pitchCompleted,
        userType: startup.userType,
        token: generateToken(startup._id, startup.userType)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/startup/pitch
// @desc    Update startup pitch
// @access  Private
router.put('/pitch', async (req, res) => {
  const { email, projectTitle, problemSolving, fundingNeeded } = req.body;

  try {
    const startup = await Startup.findOne({ email });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.projectTitle = projectTitle;
    startup.problemSolving = problemSolving;
    startup.fundingNeeded = fundingNeeded;
    startup.pitchCompleted = true;

    await startup.save();

    res.json({
      message: 'Pitch updated successfully',
      startup: {
        _id: startup._id,
        companyName: startup.companyName,
        name: startup.name,
        email: startup.email,
        projectTitle: startup.projectTitle,
        problemSolving: startup.problemSolving,
        fundingNeeded: startup.fundingNeeded,
        pitchCompleted: startup.pitchCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/startup/onboarding
// @desc    Mark startup onboarding as completed
// @access  Public
router.put('/onboarding', async (req, res) => {
  const { email } = req.body;

  try {
    const startup = await Startup.findOne({ email });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.onboardingCompleted = true;
    await startup.save();

    res.json({ message: 'Onboarding completed', onboardingCompleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startup/all
// @desc    Get all startups (for unified registration page)
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const startups = await Startup.find({}).select('companyName name email -_id');
    res.json(startups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startup/:email
// @desc    Get startup by email
// @access  Public
router.get('/:email', async (req, res) => {
  try {
    const startup = await Startup.findOne({ email: req.params.email });
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    res.json({
      _id: startup._id,
      companyName: startup.companyName,
      name: startup.name,
      email: startup.email,
      projectTitle: startup.projectTitle,
      description: startup.description,
      problemSolving: startup.problemSolving,
      fundingNeeded: startup.fundingNeeded,
      onboardingCompleted: startup.onboardingCompleted,
      pitchCompleted: startup.pitchCompleted,
      // Add missing fields that we need for the agreement page
      founderName: startup.name,
      ideaTitle: startup.projectTitle,
      ideaId: 'uhub', // This should be dynamic in a real app
      fundingAmountRequested: startup.fundingNeeded,
      currentValuation: '₹10 Crore' // This should be dynamic in a real app
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
