import express from 'express';
import Agreement from '../models/Agreement.js';

const router = express.Router();

// Create a new agreement
router.post('/', async (req, res) => {
  try {
    const agreement = new Agreement(req.body);
    await agreement.save();
    res.status(201).json(agreement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific agreement by ID
router.get('/:id', async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }
    
    console.log('Retrieving agreement:', {
      id: agreement._id,
      status: agreement.status,
      signatures: agreement.signatures,
      signatureCount: agreement.signatures.length
    });
    
    res.json(agreement);
  } catch (error) {
    console.error('Error retrieving agreement:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update an agreement by ID
router.put('/:id', async (req, res) => {
  try {
    const agreement = await Agreement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }
    res.json(agreement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit an agreement with signature
router.post('/:id/submit', async (req, res) => {
  try {
    const { signatureData } = req.body;
    
    // Find the agreement
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }
    
    console.log('Adding signature to agreement:', {
      agreementId: req.params.id,
      signatureData: signatureData,
      existingSignatures: agreement.signatures
    });
    
    // Validate signature data - more lenient validation
    if (!signatureData) {
      return res.status(400).json({ message: 'No signature data provided' });
    }
    
    // Check for required fields but allow some flexibility
    if (!signatureData.userType) {
      return res.status(400).json({ message: 'User type is required' });
    }
    
    if (!signatureData.userName) {
      return res.status(400).json({ message: 'User name is required' });
    }
    
    if (!signatureData.signature) {
      return res.status(400).json({ message: 'Signature data is required' });
    }
    
    // Add timestamp if not provided
    if (!signatureData.timestamp) {
      signatureData.timestamp = new Date().toISOString();
    }
    
    // Check if user has already signed (using userName and userType instead of userId)
    const existingSignatureIndex = agreement.signatures.findIndex(sig => 
      sig.userName === signatureData.userName && sig.userType === signatureData.userType
    );
    if (existingSignatureIndex !== -1) {
      // Update existing signature
      agreement.signatures[existingSignatureIndex] = signatureData;
      console.log('Updated existing signature for user:', signatureData.userName, signatureData.userType);
    } else {
      // Add new signature
      agreement.signatures.push(signatureData);
      console.log('Added new signature for user:', signatureData.userName, signatureData.userType);
    }
    
    // Update status based on number of signatures
    const validSignatures = agreement.signatures.filter(sig => sig.signature);
    if (validSignatures.length >= 2) {
      agreement.status = 'finalized';
    } else {
      agreement.status = 'submitted';
    }
    
    agreement.updatedAt = Date.now();
    
    // Save the updated agreement
    const savedAgreement = await agreement.save();
    
    console.log('Agreement saved with signatures:', {
      id: savedAgreement._id,
      status: savedAgreement.status,
      signatures: savedAgreement.signatures,
      signatureCount: savedAgreement.signatures.length,
      validSignatureCount: validSignatures.length
    });
    
    res.json(savedAgreement);
  } catch (error) {
    console.error('Error submitting agreement:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all agreements for a user (startup or investor)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find agreements where the user is either the startup or investor
    const agreements = await Agreement.find({
      $or: [
        { startupId: userId },
        { investorId: userId }
      ]
    });
    
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;