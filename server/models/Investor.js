import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const investorSchema = new mongoose.Schema({
  fullName: {
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
  investorType: {
    type: String,
    required: true,
    enum: ['angel', 'vc', 'private-equity', 'corporate', 'individual']
  },
  investmentRange: {
    type: String,
    required: true,
    enum: ['10k-50k', '50k-100k', '100k-500k', '500k-1m', '1m-plus']
  },
  preferredIndustries: {
    type: String,
    required: true
  },
  about: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    default: 'investor'
  }
}, {
  timestamps: true
});

// Hash password before saving
investorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
investorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Investor = mongoose.model('Investor', investorSchema);

export default Investor;
