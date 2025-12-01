import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { pitchAPI, contactAPI } from '../api/api'
import '../styles/Dashboard.css'

function BrowseStartups() {
  const navigate = useNavigate()
  const [startups, setStartups] = useState([])
  const [groupedStartups, setGroupedStartups] = useState({})
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [contactingStartup, setContactingStartup] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [savedStartups, setSavedStartups] = useState(new Set())
  const [error, setError] = useState(null)

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
      // Load saved startups from localStorage
      const saved = localStorage.getItem('savedStartups')
      if (saved) {
        setSavedStartups(new Set(JSON.parse(saved)))
      }
    }

    // Fetch all startup pitches
    fetchStartups()
  }, [navigate])

  const fetchStartups = async () => {
    try {
      setError(null)
      console.log('Fetching startups...')
      const data = await pitchAPI.getAllPitches()
      console.log('Received data from API:', data)
      console.log('Total startups fetched:', data?.length || 0)
      
      // Filter only startups with pitch data
      let startupsWithPitch = data.filter(startup => startup.projectTitle)
      console.log('Startups with pitch data:', startupsWithPitch.length)
      
      // Get agreed startups from localStorage to filter out
      let agreedStartups = [];
      try {
        const storedAgreedStartups = localStorage.getItem('agreedStartups');
        if (storedAgreedStartups) {
          agreedStartups = JSON.parse(storedAgreedStartups);
        }
      } catch (error) {
        console.error('Error parsing agreed startups:', error);
      }
      
      // Filter out startups that have been agreed upon
      if (agreedStartups.length > 0) {
        const beforeFilter = startupsWithPitch.length
        startupsWithPitch = startupsWithPitch.filter(startup => {
          // Check if this startup has been agreed upon
          const isAgreedStartup = agreedStartups.some(agreed => 
            agreed.startupName === startup.companyName
          );
          
          // Only show startup if it's not an agreed startup
          return !isAgreedStartup;
        });
        console.log(`Filtered out ${beforeFilter - startupsWithPitch.length} agreed startups`)
      }
      
      console.log('Final startups to display:', startupsWithPitch.length)
      setStartups(startupsWithPitch)
      
      // Group startups by company name and sort members
      const grouped = {}
      startupsWithPitch.forEach(startup => {
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
      
      // If no startups found, provide helpful feedback
      if (startupsWithPitch.length === 0 && data && data.length > 0) {
        const startupsWithoutPitch = data.filter(startup => !startup.projectTitle)
        if (startupsWithoutPitch.length > 0) {
          setError(`Found ${data.length} startup(s) in the system, but none have submitted their pitch yet. Startups need to complete their pitch submission to be visible.`)
        }
      } else if (startupsWithPitch.length === 0) {
        setError('No startups have submitted their pitches yet. Startups need to register and submit their pitch to appear here.')
      }
    } catch (error) {
      console.error('Error fetching startups:', error)
      setError(error.message || 'Failed to fetch startups. Please check if the backend server is running on port 5000.')
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

  const handleContactClick = (startup) => {
    setContactingStartup(startup)
    setContactMessage('')
  }

  const handleSendContact = async () => {
    if (!contactMessage.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      // Generate a conversation ID for new conversations
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const messageData = {
        senderId: userData._id,
        senderName: userData.fullName,
        receiverId: contactingStartup._id,
        receiverName: contactingStartup.companyName,
        content: contactMessage,
        senderType: 'investor',
        receiverType: 'startup',
        conversationId: conversationId
      }

      await contactAPI.sendMessage(messageData)
      alert(`Message sent to ${contactingStartup.companyName}!`)
      setContactingStartup(null)
      setContactMessage('')
    } catch (error) {
      console.error('Contact error:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  const handleSaveStartup = (startup) => {
    const newSavedStartups = new Set(savedStartups)
    const startupKey = `${startup.companyName}-${startup._id}`
    
    if (newSavedStartups.has(startupKey)) {
      // Remove from saved
      newSavedStartups.delete(startupKey)
    } else {
      // Add to saved
      newSavedStartups.add(startupKey)
    }
    
    setSavedStartups(newSavedStartups)
    // Save to localStorage
    localStorage.setItem('savedStartups', JSON.stringify(Array.from(newSavedStartups)))
    
    // Show feedback
    const action = newSavedStartups.has(startupKey) ? 'saved' : 'unsaved'
    alert(`Startup ${action} successfully!`)
  }

  // Add useEffect to listen for changes to saved startups
  useEffect(() => {
    // This will refresh the saved startups when the component mounts
    // and when localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'savedStartups') {
        const saved = localStorage.getItem('savedStartups')
        if (saved) {
          try {
            setSavedStartups(new Set(JSON.parse(saved)))
          } catch (error) {
            console.error('Error parsing saved startups:', error)
            setSavedStartups(new Set())
          }
        } else {
          setSavedStartups(new Set())
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also refresh when component mounts
    const saved = localStorage.getItem('savedStartups')
    if (saved) {
      try {
        setSavedStartups(new Set(JSON.parse(saved)))
      } catch (error) {
        console.error('Error parsing saved startups:', error)
        setSavedStartups(new Set())
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Convert dollar investment range to Rupees or Lakhs
  const convertDollarToRupees = (investmentRange) => {
    // Conversion rate: $1 = ₹83 (approximate)
    const USD_TO_INR_RATE = 83
    
    // Map dollar ranges to Rupee ranges
    const conversionMap = {
      '10k-50k': '₹8.3L - ₹41.5L (₹8,30,000 - ₹41,50,000)',
      '50k-100k': '₹41.5L - ₹83L (₹41,50,000 - ₹83,00,000)',
      '100k-500k': '₹83L - ₹415L (₹83,00,000 - ₹41,50,00,000)',
      '500k-1m': '₹415L - ₹830L (₹41,50,00,000 - ₹83,00,00,000)',
      '1m-plus': '₹830L+ (₹83,00,00,000+)'
    }
    
    // Return converted value or original if not found
    return conversionMap[investmentRange] || investmentRange
  }

  if (loading) {
    return <div>Loading startups...</div>
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>💼 Browse Startups</h2>
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
          <h1>🚀 Available Startups</h1>
          <p>Explore innovative startups looking for investment</p>
        </div>

        {error && (
          <div style={{
            padding: '20px',
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            <h3 style={{ marginTop: 0, color: '#856404' }}>ℹ️ Information</h3>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        )}
        
        {startups.length === 0 && !loading ? (
          <div className="no-startups">
            <h3>No startups available yet</h3>
            <p>Check back later to discover new investment opportunities!</p>
            {!error && (
              <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                Startups need to register and submit their pitch to appear here.
              </p>
            )}
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
                          className="btn btn-primary"
                          onClick={() => handleContactClick(startup)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '0.95rem'
                          }}
                        >
                          Contact
                        </button>
                        <button 
                          className={`btn ${savedStartups.has(`${startup.companyName}-${startup._id}`) ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleSaveStartup(startup)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '0.95rem'
                          }}
                        >
                          {savedStartups.has(`${startup.companyName}-${startup._id}`) ? 'Unsave' : 'Save'}
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

      {/* Contact Modal */}
      {contactingStartup && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal" style={{ maxWidth: '500px' }}>
            <h2>💬 Contact {contactingStartup.companyName}</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Send a message to {contactingStartup.name}
            </p>
            
            <div className="form-group">
              <label htmlFor="contactMessage">Your Message</label>
              <textarea
                id="contactMessage"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows="6"
                placeholder="Introduce yourself and express your interest in this startup..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={handleSendContact}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Send Message
              </button>
              <button 
                onClick={() => setContactingStartup(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrowseStartups