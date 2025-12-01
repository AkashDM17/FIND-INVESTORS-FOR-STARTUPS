import express from 'express';
import { body, validationResult } from 'express-validator';
import Investor from '../models/Investor.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// @route   GET /api/investor/all
// @desc    Get all investors
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const investors = await Investor.find({}).select('-password');
    res.json(investors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/investor/register
// @desc    Register a new investor
// @access  Public
router.post('/register', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('investorType').notEmpty().withMessage('Investor type is required'),
  body('investmentRange').notEmpty().withMessage('Investment range is required'),
  body('preferredIndustries').notEmpty().withMessage('Preferred industries are required'),
  body('about').notEmpty().withMessage('About section is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { fullName, email, password, investorType, investmentRange, preferredIndustries, about, companyName } = req.body;

  try {
    // Check if investor already exists
    const investorExists = await Investor.findOne({ email });
    if (investorExists) {
      return res.status(400).json({ message: 'Investor with this email already exists' });
    }

    // Create new investor
    const investor = await Investor.create({
      fullName,
      email,
      password,
      investorType,
      investmentRange,
      preferredIndustries,
      about,
      companyName
    });

    if (investor) {
      res.status(201).json({
        _id: investor._id,
        fullName: investor.fullName,
        email: investor.email,
        investorType: investor.investorType,
        investmentRange: investor.investmentRange,
        preferredIndustries: investor.preferredIndustries,
        about: investor.about,
        companyName: investor.companyName,
        onboardingCompleted: investor.onboardingCompleted,
        userType: investor.userType,
        token: generateToken(investor._id, investor.userType)
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/investor/login
// @desc    Login investor
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
    const investor = await Investor.findOne({ email });

    if (investor && (await investor.matchPassword(password))) {
      res.json({
        _id: investor._id,
        fullName: investor.fullName,
        email: investor.email,
        investorType: investor.investorType,
        investmentRange: investor.investmentRange,
        preferredIndustries: investor.preferredIndustries,
        about: investor.about,
        companyName: investor.companyName,
        onboardingCompleted: investor.onboardingCompleted,
        userType: investor.userType,
        token: generateToken(investor._id, investor.userType)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/investor/onboarding
// @desc    Mark investor onboarding as completed
// @access  Public
router.put('/onboarding', async (req, res) => {
  const { email } = req.body;

  try {
    const investor = await Investor.findOne({ email });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    investor.onboardingCompleted = true;
    await investor.save();

    res.json({ message: 'Onboarding completed', onboardingCompleted: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/investor/:email
// @desc    Get investor by email
// @access  Public
router.get('/:email', async (req, res) => {
  try {
    const investor = await Investor.findOne({ email: req.params.email });
    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }
    res.json({
      _id: investor._id,
      fullName: investor.fullName,
      email: investor.email,
      investorType: investor.investorType,
      investmentRange: investor.investmentRange,
      preferredIndustries: investor.preferredIndustries,
      about: investor.about,
      companyName: investor.companyName,
      onboardingCompleted: investor.onboardingCompleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
