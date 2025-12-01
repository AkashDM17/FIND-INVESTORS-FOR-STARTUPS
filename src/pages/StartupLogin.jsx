import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startupAPI } from '../api/api'
import '../styles/Auth.css'

function StartupLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
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
    setLoading(true)
    
    // Validate form data
    if (!formData.email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }
    
    if (!formData.password) {
      setError('Password is required')
      setLoading(false)
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    
    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }
    
    try {
      const result = await startupAPI.login(formData)
      
      // Store token in localStorage
      localStorage.setItem('token', result.token)
      localStorage.setItem('userType', result.userType)
      localStorage.setItem('userData', JSON.stringify(result))
      
      navigate('/startup/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      // Provide more specific error messages
      if (error.message && error.message.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message && error.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please ensure the backend is running.')
      } else {
        setError(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // Always navigate to the home page to avoid confusion
    navigate('/')
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <h1>🚀 Startup Login</h1>
          <p>Welcome back! Login to your startup account</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="form-footer">
          <button onClick={handleBack} className="btn btn-secondary" style={{ marginRight: '10px' }}>
            ← Back
          </button>
          Don't have an account? <Link to="/startup/register">Register here</Link>
        </div>
      </div>
    </div>
  )
}

export default StartupLogin