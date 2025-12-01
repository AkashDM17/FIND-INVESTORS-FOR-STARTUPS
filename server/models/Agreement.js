import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
  startupId: {
    type: String,
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  investorId: {
    type: String,
    required: true
  },
  investorName: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: false  // Make this optional since we'll generate it when needed
  },
  investmentAmount: {
    type: String,
    default: ''
  },
  equityStake: {
    type: String,
    default: ''
  },
  valuationCap: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'created', 'acknowledged', 'submitted', 'finalized'],
    default: 'draft'
  },
  signatures: [{
    userId: String,
    userName: String,
    userType: String,
    signature: String,
    timestamp: Date,
    acknowledged: Boolean
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Agreement', agreementSchema);