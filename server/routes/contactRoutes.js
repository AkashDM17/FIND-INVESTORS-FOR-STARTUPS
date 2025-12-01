import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// @route   POST /api/contacts
// @desc    Create a new contact request
// @access  Public
router.post('/', async (req, res) => {
  const { investorId, investorName, investorEmail, startupId, startupName, startupEmail, message } = req.body;

  try {
    const contact = await Contact.create({
      investorId,
      investorName,
      investorEmail,
      startupId,
      startupName,
      startupEmail,
      message
    });

    res.status(201).json({
      message: 'Contact request sent successfully',
      contact
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/contacts/startup/:email
// @desc    Get all contacts for a startup
// @access  Public
router.get('/startup/:email', async (req, res) => {
  try {
    const contacts = await Contact.find({ startupEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/contacts/investor/:email
// @desc    Get all contacts sent by an investor
// @access  Public
router.get('/investor/:email', async (req, res) => {
  try {
    const contacts = await Contact.find({ investorEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/contacts/:id/read
// @desc    Mark contact as read
// @access  Public
router.put('/:id/read', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.status = 'read';
    await contact.save();

    res.json({ message: 'Contact marked as read', contact });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
