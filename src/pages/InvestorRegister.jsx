import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { investorAPI } from '../api/api'
import '../styles/Auth.css'

function InvestorRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    investorType: '',
    investmentRange: '',
    preferredIndustries: '',
    about: '',
    companyName: '' // Add company name field
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return
    }
    
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!formData.investorType) {
      setError('Please select an investor type')
      return
    }
    
    if (!formData.investmentRange) {
      setError('Please select an investment range')
      return
    }
    
    if (!formData.preferredIndustries.trim()) {
      setError('Preferred industries are required')
      return
    }
    
    if (!formData.about.trim()) {
      setError('About section is required')
      return
    }
    
    if (!formData.password) {
      setError('Password is required')
      return
    }
    
    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    
    setLoading(true)
    try {
      const { confirmPassword, ...registerData } = formData
      const result = await investorAPI.register(registerData)
      
      // Store token in localStorage
      localStorage.setItem('token', result.token)
      localStorage.setItem('userType', result.userType)
      localStorage.setItem('userData', JSON.stringify(result))
      
      navigate('/investor/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message || 'Unable to connect to server. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <h1>💼 Investor Registration</h1>
          <p>Create your investor account and discover startups</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="investorType">Investor Type</label>
            <select
              id="investorType"
              name="investorType"
              value={formData.investorType}
              onChange={handleChange}
              required
            >
              <option value="">Select investor type</option>
              <option value="angel">Angel Investor</option>
              <option value="vc">Venture Capital</option>
              <option value="private-equity">Private Equity</option>
              <option value="corporate">Corporate Investor</option>
              <option value="individual">Individual Investor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="investmentRange">Investment Range</label>
            <select
              id="investmentRange"
              name="investmentRange"
              value={formData.investmentRange}
              onChange={handleChange}
              required
            >
              <option value="">Select investment range</option>
              <option value="10k-50k">₹8.3L - ₹41.5L (₹8,30,000 - ₹41,50,00,000)</option>
              <option value="50k-100k">₹41.5L - ₹83L (₹41,50,000 - ₹83,00,00,000)</option>
              <option value="100k-500k">₹83L - ₹415L (₹83,00,000 - ₹41,50,00,000)</option>
              <option value="500k-1m">₹415L - ₹830L (₹41,50,00,000 - ₹83,00,00,000)</option>
              <option value="1m-plus">₹830L+ (₹83,00,00,000+)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="preferredIndustries">Preferred Industries</label>
            <input
              type="text"
              id="preferredIndustries"
              name="preferredIndustries"
              value={formData.preferredIndustries}
              onChange={handleChange}
              required
              placeholder="e.g., Technology, Healthcare, FinTech"
            />
          </div>

          <div className="form-group">
            <label htmlFor="about">About You</label>
            <textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              required
              placeholder="Tell us about your investment experience and interests"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="form-footer">
          Already have an account? <Link to="/investor/login">Login here</Link>
        </div>
      </div>
    </div>
  )
}

export default InvestorRegister