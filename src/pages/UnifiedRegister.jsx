import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startupAPI, investorAPI } from '../api/api'
import '../styles/Auth.css'

function UnifiedRegister() {
  const navigate = useNavigate()
  const [userType, setUserType] = useState('startup') // 'startup' or 'investor'
  const [existingMembers, setExistingMembers] = useState({ startups: {}, investors: [] })
  const [showMembers, setShowMembers] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // Startup form data
  const [startupData, setStartupData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  // Investor form data
  const [investorData, setInvestorData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    investorType: '',
    investmentRange: '',
    preferredIndustries: ''
  })
  
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExistingMembers()
  }, [])

  const fetchExistingMembers = async () => {
    setLoading(true)
    try {
      // Fetch all startups
      const startupsResponse = await fetch('http://localhost:5000/api/startup/all')
      const startupsData = await startupsResponse.json()
      
      // Fetch all investors
      const investorsResponse = await fetch('http://localhost:5000/api/investor/all')
      const investorsData = await investorsResponse.json()
      
      // Group startups by company name and sort by user name
      const groupedStartups = {}
      startupsData.forEach(startup => {
        const companyName = startup.companyName || 'Unknown Company'
        if (!groupedStartups[companyName]) {
          groupedStartups[companyName] = []
        }
        groupedStartups[companyName].push(startup)
      })
      
      // Sort users within each company alphabetically by name
      Object.keys(groupedStartups).forEach(company => {
        groupedStartups[company].sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        )
      })
      
      // Sort company names alphabetically
      const sortedGroupedStartups = {}
      Object.keys(groupedStartups).sort().forEach(key => {
        sortedGroupedStartups[key] = groupedStartups[key]
      })
      
      setExistingMembers({
        startups: sortedGroupedStartups,
        investors: investorsData || []
      })
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total startup count
  const getTotalStartupCount = () => {
    return Object.values(existingMembers.startups).reduce((total, users) => total + users.length, 0)
  }

  const handleStartupChange = (e) => {
    setStartupData({
      ...startupData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleInvestorChange = (e) => {
    setInvestorData({
      ...investorData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleStartupSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (startupData.password !== startupData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const result = await startupAPI.register({
        companyName: startupData.companyName,
        name: startupData.name,
        email: startupData.email,
        password: startupData.password
      })

      if (result.token) {
        localStorage.setItem('token', result.token)
        localStorage.setItem('userType', 'startup')
        localStorage.setItem('userData', JSON.stringify(result))
        navigate('/startup/dashboard')
      }
    } catch (error) {
      setError(error.message || 'Registration failed')
    }
  }

  const handleInvestorSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (investorData.password !== investorData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!investorData.investorType) {
      setError('Please select investor type')
      return
    }

    try {
      const result = await investorAPI.register(investorData)

      if (result.token) {
        localStorage.setItem('token', result.token)
        localStorage.setItem('userType', 'investor')
        localStorage.setItem('userData', JSON.stringify(result))
        navigate('/investor/dashboard')
      }
    } catch (error) {
      setError(error.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="unified-register-page">
        {/* Header */}
        <div className="register-header" style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀 Join Our Platform</h1>
          <p style={{ fontSize: '1.1rem', opacity: '0.95' }}>
            One unified registration for all members - Organized by company
          </p>
        </div>

        {/* Existing Members Section */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#667eea', fontSize: '1.8rem' }}>
              👥 Registered Members ({getTotalStartupCount() + existingMembers.investors.length})
            </h2>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              {showMembers ? '🔼 Hide' : '🔽 Show'} Members
            </button>
          </div>

          {showMembers && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              marginBottom: '40px'
            }}>
              {/* Startups Column - Grouped by Company */}
              <div style={{
                flex: '1 1 calc(50% - 12px)',
                minWidth: '300px',
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid #667eea'
              }}>
                <h3 style={{ color: '#667eea', marginBottom: '16px', fontSize: '1.3rem' }}>
                  🚀 Startups ({getTotalStartupCount()})
                </h3>
                {loading ? (
                  <p style={{ color: '#666' }}>Loading...</p>
                ) : Object.keys(existingMembers.startups).length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No startups registered yet</p>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {Object.entries(existingMembers.startups).map(([companyName, users], companyIndex) => (
                      <div key={companyIndex} style={{
                        marginBottom: '20px',
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #667eea'
                      }}>
                        <h4 style={{ 
                          color: '#667eea', 
                          marginBottom: '12px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          borderBottom: '2px solid #667eea',
                          paddingBottom: '8px'
                        }}>
                          🏢 {companyName} ({users.length})
                        </h4>
                        {users.map((user, userIndex) => (
                          <div key={userIndex} style={{
                            padding: '10px 12px',
                            marginBottom: '8px',
                            background: 'white',
                            borderRadius: '8px',
                            borderLeft: '4px solid #667eea',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              background: '#667eea', 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '24px', 
                              height: '24px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {userIndex + 1}
                            </span>
                            <div>
                              <p style={{ margin: '0', fontWeight: '600', color: '#333', fontSize: '0.95rem' }}>
                                👤 {user.name || 'N/A'}
                              </p>
                              <p style={{ margin: '0', fontSize: '0.8rem', color: '#666' }}>
                                📧 {user.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Investors Column */}
              <div style={{
                flex: '1 1 calc(50% - 12px)',
                minWidth: '300px',
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid #764ba2'
              }}>
                <h3 style={{ color: '#764ba2', marginBottom: '16px', fontSize: '1.3rem' }}>
                  💼 Investors ({existingMembers.investors.length})
                </h3>
                {loading ? (
                  <p style={{ color: '#666' }}>Loading...</p>
                ) : existingMembers.investors.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No investors registered yet</p>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {existingMembers.investors.map((investor, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        marginBottom: '10px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        borderLeft: '4px solid #764ba2'
                      }}>
                        <p style={{ margin: '4px 0', fontWeight: '600', color: '#333' }}>
                          {investor.fullName || 'N/A'}
                        </p>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>
                          {investor.investorType || 'N/A'} • {investor.investmentRange || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Registration Form Section */}
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '24px', textAlign: 'center', fontSize: '1.8rem' }}>
            ✨ Register New Member
          </h2>

          {/* User Type Selector */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setUserType('startup')}
              className={`btn ${userType === 'startup' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: '1',
                maxWidth: '200px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🚀 Startup
            </button>
            <button
              onClick={() => setUserType('investor')}
              className={`btn ${userType === 'investor' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: '1',
                maxWidth: '200px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              💼 Investor
            </button>
          </div>

          {error && (
            <div className="error-message" style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Startup Registration Form */}
          {userType === 'startup' && (
            <form onSubmit={handleStartupSubmit}>
              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={startupData.companyName}
                  onChange={handleStartupChange}
                  required
                  placeholder="Enter your company name"
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                  💡 Multiple users can register under the same company
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={startupData.name}
                  onChange={handleStartupChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={startupData.email}
                  onChange={handleStartupChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={startupData.password}
                  onChange={handleStartupChange}
                  required
                  placeholder="Create a password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={startupData.confirmPassword}
                  onChange={handleStartupChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Register as Startup →
              </button>

              <p style={{ textAlign: 'center', marginTop: '16px' }}>
                Already have an account? <Link to="/startup/login" style={{ color: '#667eea' }}>Login here</Link>
              </p>
            </form>
          )}

          {/* Investor Registration Form */}
          {userType === 'investor' && (
            <form onSubmit={handleInvestorSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={investorData.fullName}
                  onChange={handleInvestorChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={investorData.email}
                  onChange={handleInvestorChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={investorData.password}
                  onChange={handleInvestorChange}
                  required
                  placeholder="Create a password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={investorData.confirmPassword}
                  onChange={handleInvestorChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="investorType">Investor Type *</label>
                <select
                  id="investorType"
                  name="investorType"
                  value={investorData.investorType}
                  onChange={handleInvestorChange}
                  required
                >
                  <option value="">Select investor type</option>
                  <option value="Angel Investor">Angel Investor</option>
                  <option value="Venture Capitalist">Venture Capitalist</option>
                  <option value="Private Equity">Private Equity</option>
                  <option value="Corporate Investor">Corporate Investor</option>
                  <option value="Individual Investor">Individual Investor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="investmentRange">Investment Range *</label>
                <input
                  type="text"
                  id="investmentRange"
                  name="investmentRange"
                  value={investorData.investmentRange}
                  onChange={handleInvestorChange}
                  required
                  placeholder="e.g., ₹10L - ₹1Cr"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredIndustries">Preferred Industries *</label>
                <input
                  type="text"
                  id="preferredIndustries"
                  name="preferredIndustries"
                  value={investorData.preferredIndustries}
                  onChange={handleInvestorChange}
                  required
                  placeholder="e.g., Technology, Healthcare, E-commerce"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Register as Investor →
              </button>

              <p style={{ textAlign: 'center', marginTop: '16px' }}>
                Already have an account? <Link to="/investor/login" style={{ color: '#667eea' }}>Login here</Link>
              </p>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/" className="btn btn-secondary">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

export default UnifiedRegister
