import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { contactAPI } from '../api/api'
import '../styles/Dashboard.css'

function BrowseInvestors() {
  const navigate = useNavigate()
  const [investors, setInvestors] = useState([])
  const [groupedInvestors, setGroupedInvestors] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contactingInvestor, setContactingInvestor] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')

    if (!token || userType !== 'startup') {
      navigate('/startup/login')
      return
    }

    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    fetchInvestors()
  }, [navigate])

  const fetchInvestors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:5000/api/investor/all')
      if (!response.ok) {
        throw new Error('Failed to fetch investors')
      }
      const data = await response.json()
      setInvestors(data)
      
      // Group investors by investor type and sort by name
      const grouped = {}
      data.forEach(investor => {
        const investorType = investor.investorType || 'Other'
        if (!grouped[investorType]) {
          grouped[investorType] = []
        }
        grouped[investorType].push(investor)
      })
      
      // Sort investors within each type alphabetically by fullName
      Object.keys(grouped).forEach(type => {
        grouped[type].sort((a, b) => 
          (a.fullName || '').localeCompare(b.fullName || '')
        )
      })
      
      // Sort investor types alphabetically
      const sortedGrouped = {}
      Object.keys(grouped).sort().forEach(key => {
        sortedGrouped[key] = grouped[key]
      })
      
      setGroupedInvestors(sortedGrouped)
    } catch (error) {
      console.error('Error fetching investors:', error)
      setError('Failed to load investors. Please try again.')
    } finally {
      setLoading(false)
    }
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
        senderName: userData.companyName,
        receiverId: contactingInvestor._id,
        receiverName: contactingInvestor.fullName,
        content: contactMessage,
        senderType: 'startup',
        receiverType: 'investor',
        conversationId: conversationId
      }

      await contactAPI.sendMessage(messageData)
      alert(`Message sent to ${contactingInvestor.fullName}!`)
      setContactingInvestor(null)
      setContactMessage('')
    } catch (error) {
      console.error('Contact error:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>🚀 Browse Investors</h2>
        </div>
        <div className="nav-links">
          <Link to="/startup/dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Available Investors</h1>
          <p>Connect with investors who match your startup needs</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: '#667eea' }}>
            Loading investors...
          </div>
        )}

        {error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: '#fee', 
            color: '#c33',
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            {error}
            <button 
              onClick={fetchInvestors} 
              className="btn btn-primary"
              style={{ marginTop: '10px', display: 'block', margin: '10px auto 0' }}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && investors.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: '#f8f9fa',
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
            <h3>No Investors Found</h3>
            <p>There are currently no investors registered in the system.</p>
          </div>
        )}

        {!loading && !error && investors.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            {Object.entries(groupedInvestors).map(([investorType, members], typeIndex) => (
              <div key={typeIndex} style={{
                marginBottom: '40px',
                padding: '24px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px solid #764ba2'
              }}>
                {/* Investor Type Header */}
                <div style={{
                  borderBottom: '3px solid #764ba2',
                  paddingBottom: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ 
                    color: '#764ba2', 
                    fontSize: '1.8rem',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    💼 {investorType}
                    <span style={{
                      background: '#764ba2',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {members.length} {members.length === 1 ? 'Investor' : 'Investors'}
                    </span>
                  </h2>
                </div>

                {/* Investors Grid */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px'
                }}>
                  {members.map((investor, memberIndex) => (
                    <div key={memberIndex} style={{
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
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(118, 75, 162, 0.2)'
                      e.currentTarget.style.borderColor = '#764ba2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                    }}>
                      {/* Investor Number Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: '#764ba2',
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

                      {/* Investor Icon */}
                      <div style={{ fontSize: '3rem', marginBottom: '16px', textAlign: 'center' }}>💼</div>
                      
                      {/* Investor Name */}
                      <h3 style={{ 
                        color: '#764ba2', 
                        marginBottom: '16px', 
                        fontSize: '1.3rem',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        {investor.fullName}
                      </h3>
                      
                      {/* Investor Details */}
                      <div style={{ 
                        background: 'white', 
                        padding: '16px', 
                        borderRadius: '12px',
                        marginTop: '12px'
                      }}>
                        <p style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
                          <strong style={{ color: '#764ba2' }}>📧 Email:</strong> {investor.email}
                        </p>
                        <p style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
                          <strong style={{ color: '#764ba2' }}>👔 Type:</strong> {investor.investorType}
                        </p>
                        <p style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
                          <strong style={{ color: '#764ba2' }}>💰 Investment Range:</strong> {investor.investmentRange}
                        </p>
                        <p style={{ marginBottom: '0', fontSize: '0.95rem' }}>
                          <strong style={{ color: '#764ba2' }}>🎯 Preferred Industries:</strong> {investor.preferredIndustries}
                        </p>
                      </div>
                      
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setContactingInvestor(investor)
                          setContactMessage('')
                        }}
                        style={{
                          width: '100%',
                          marginTop: '16px',
                          padding: '10px',
                          fontSize: '0.95rem'
                        }}
                      >
                        📧 Contact Investor
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && investors.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px',
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h3 style={{ marginBottom: '8px' }}>✨ Total Investors: {investors.length}</h3>
            <p style={{ opacity: '0.9', fontSize: '0.95rem' }}>
              Connect with these investors to fund your startup!
            </p>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {contactingInvestor && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal" style={{ maxWidth: '500px' }}>
            <h2>💬 Contact {contactingInvestor.fullName}</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Send a message to {contactingInvestor.fullName}
            </p>
            
            <div className="form-group">
              <label htmlFor="contactMessage">Your Message</label>
              <textarea
                id="contactMessage"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows="6"
                placeholder="Introduce your startup and express your interest in connecting with this investor..."
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
                onClick={() => setContactingInvestor(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendContact}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrowseInvestors
