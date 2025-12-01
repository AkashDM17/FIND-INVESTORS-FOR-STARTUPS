import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pitchAPI } from '../api/api'
import '../styles/Dashboard.css'

function SavedStartups() {
  const navigate = useNavigate()
  const [savedStartups, setSavedStartups] = useState([])
  const [groupedStartups, setGroupedStartups] = useState({})
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')

    if (!token || userType !== 'investor') {
      navigate('/investor/login')
      return
    }

    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    // Load saved startups from localStorage
    loadSavedStartups()
    
    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'savedStartups') {
        loadSavedStartups()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate])

  const loadSavedStartups = async () => {
    try {
      // Get saved startup keys from localStorage
      const savedKeys = localStorage.getItem('savedStartups')
      if (!savedKeys) {
        setLoading(false)
        return
      }

      const savedStartupKeys = JSON.parse(savedKeys)
      
      // Fetch all startup pitches
      const allStartups = await pitchAPI.getAllPitches()
      
      // Filter only saved startups
      const savedStartupData = allStartups.filter(startup => {
        const key = `${startup.companyName}-${startup._id}`
        return savedStartupKeys.includes(key)
      })
      
      setSavedStartups(savedStartupData)
      
      // Group startups by company name and sort members
      const grouped = {}
      savedStartupData.forEach(startup => {
        const companyName = startup.companyName || 'Unknown Company'
        if (!grouped[companyName]) {
          grouped[companyName] = []
        }
        grouped[companyName].push(startup)
      })
      
      // Sort members within each company alphabetically by name
      Object.keys(grouped).forEach(company => {
        grouped[company].sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        )
      })
      
      // Sort company names alphabetically
      const sortedGrouped = {}
      Object.keys(grouped).sort().forEach(key => {
        sortedGrouped[key] = grouped[key]
      })
      
      setGroupedStartups(sortedGrouped)
      setLoading(false)
    } catch (error) {
      console.error('Error loading saved startups:', error)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userData')
    localStorage.removeItem('investorOnboardingCompleted')
    navigate('/')
  }

  const handleRemoveSaved = (startup) => {
    // Get current saved startups
    const savedKeys = localStorage.getItem('savedStartups')
    if (savedKeys) {
      const savedStartupKeys = JSON.parse(savedKeys)
      const startupKey = `${startup.companyName}-${startup._id}`
      
      // Remove the startup from saved list
      const updatedKeys = savedStartupKeys.filter(key => key !== startupKey)
      
      // Update localStorage
      localStorage.setItem('savedStartups', JSON.stringify(updatedKeys))
      
      // Reload the saved startups
      loadSavedStartups()
      
      alert('Startup removed from saved list!')
    }
  }

  if (loading) {
    return <div>Loading saved startups...</div>
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>⭐ Saved Startups</h2>
        </div>
        <div className="nav-links">
          <Link to="/investor/dashboard" className="btn btn-secondary" style={{ marginRight: '15px' }}>
            ← Back to Dashboard
          </Link>
          <span className="user-name">Welcome, {userData?.fullName}</span>
          <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>⭐ Your Saved Startups</h1>
          <p>Startups you've bookmarked for future reference</p>
        </div>

        {savedStartups.length === 0 ? (
          <div className="no-startups">
            <h3>No saved startups yet</h3>
            <p>You haven't saved any startups. Browse startups and save the ones you're interested in!</p>
            <Link to="/investor/browse-startups" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Browse Startups
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: '30px' }}>
            {Object.entries(groupedStartups).map(([companyName, members], companyIndex) => (
              <div key={companyIndex} style={{
                marginBottom: '40px',
                padding: '24px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid #667eea'
              }}>
                {/* Company Header */}
                <div style={{
                  borderBottom: '3px solid #667eea',
                  paddingBottom: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ 
                    color: '#667eea', 
                    fontSize: '1.8rem',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    🏢 {companyName}
                    <span style={{
                      background: '#667eea',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {members.length} {members.length === 1 ? 'Member' : 'Members'}
                    </span>
                  </h2>
                </div>

                {/* Members Grid */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px'
                }}>
                  {members.map((startup, memberIndex) => (
                    <div key={startup._id} style={{
                      flex: '1 1 calc(50% - 12px)',
                      minWidth: '300px',
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.2)'
                      e.currentTarget.style.borderColor = '#667eea'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                    }}>
                      {/* Member Number Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {memberIndex + 1}
                      </div>

                      {/* Member Info */}
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ color: '#667eea', margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                          👤 {startup.name}
                        </h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                          📧 {startup.email}
                        </p>
                      </div>
                      
                      <div className="pitch-details">
                        <div className="pitch-section" style={{ marginBottom: '16px' }}>
                          <h4 style={{ color: '#667eea', fontSize: '1rem', marginBottom: '8px' }}>💡 Project Title/Idea</h4>
                          <p style={{ color: '#333', fontSize: '0.95rem', lineHeight: '1.5' }}>{startup.projectTitle}</p>
                        </div>

                        <div className="pitch-section" style={{ marginBottom: '16px' }}>
                          <h4 style={{ color: '#667eea', fontSize: '1rem', marginBottom: '8px' }}>🎯 Problem Solving/Description</h4>
                          <p style={{ color: '#333', fontSize: '0.95rem', lineHeight: '1.5' }}>{startup.problemSolving}</p>
                        </div>

                        <div className="pitch-section" style={{ marginBottom: '16px' }}>
                          <h4 style={{ color: '#667eea', fontSize: '1rem', marginBottom: '8px' }}>💰 Funding Needed</h4>
                          <p style={{ 
                            color: '#667eea', 
                            fontSize: '1.1rem', 
                            fontWeight: 'bold',
                            background: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            display: 'inline-block'
                          }}>
                            {startup.fundingNeeded}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleRemoveSaved(startup)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '0.95rem'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedStartups