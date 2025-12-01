import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const startupSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  industry: {
    type: String,
    required: false,
    enum: ['technology', 'healthcare', 'fintech', 'ecommerce', 'education', 'other']
  },
  fundingStage: {
    type: String,
    required: false,
    enum: ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c']
  },
  description: {
    type: String,
    required: false
  },
  projectTitle: {
    type: String,
    required: false
  },
  problemSolving: {
    type: String,
    required: false
  },
  fundingNeeded: {
    type: String,
    required: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  pitchCompleted: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    default: 'startup'
  }
}, {
  timestamps: true
});

// Hash password before saving
startupSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
startupSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;
