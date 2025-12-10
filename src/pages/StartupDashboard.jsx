import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { startupAPI, contactAPI, agreementAPI } from '../api/api'
import { jsPDF } from "jspdf";
import '../styles/Dashboard.css'

function StartupDashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [pitchData, setPitchData] = useState({
    projectTitle: '',
    problemSolving: '',
    fundingNeeded: ''
  })
  const [fundingInDollars, setFundingInDollars] = useState('')
  const [fundingInRupees, setFundingInRupees] = useState('')
  const USD_TO_INR_RATE = 83 // Approximate conversion rate
  const [hasCompletedPitch, setHasCompletedPitch] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [investors, setInvestors] = useState([])
  const [loadingInvestors, setLoadingInvestors] = useState(false)
  const [showInvestors, setShowInvestors] = useState(false)
  const [showPitchForm, setShowPitchForm] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [contactingInvestor, setContactingInvestor] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [agreements, setAgreements] = useState([])
  const [loadingAgreements, setLoadingAgreements] = useState(false)
  const [pendingAgreementNotification, setPendingAgreementNotification] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')
    const pitchCompleted = localStorage.getItem('pitchCompleted')

    if (!token || userType !== 'startup') {
      navigate('/startup/login')
      return
    }

    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)
      
      // Check onboarding status from database (in userData)
      // Only show onboarding if it's explicitly false or undefined
      if (parsedUserData.onboardingCompleted === true) {
        setShowOnboarding(false)
      } else {
        setShowOnboarding(true)
      }
    }

    if (pitchCompleted) {
      setHasCompletedPitch(true)
    }
  }, [navigate])

  // Check for pending agreement notification and verify if both parties have signed
  useEffect(() => {
    const checkPendingAgreement = async () => {
      const storedNotification = localStorage.getItem('pendingAgreementNotification');
      if (storedNotification) {
        try {
          const notification = JSON.parse(storedNotification);
          // Show notification if it's for startup user type OR if investor has signed (cross-dashboard)
          if (notification.userType === 'startup' || notification.signedBy === 'investor') {
            // Verify if agreement is still pending by checking the database
            if (userData && userData._id && notification.agreementId) {
              try {
                const userAgreements = await agreementAPI.getUserAgreements(userData._id);
                const agreement = userAgreements.find(ag => ag._id === notification.agreementId);
                
                if (agreement && agreement.signatures) {
                  const startupSigned = agreement.signatures.some(sig => 
                    sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
                  );
                  const investorSigned = agreement.signatures.some(sig => 
                    sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
                  );
                  
                  // If both parties have signed, clear notification and redirect
                  if (startupSigned && investorSigned) {
                    localStorage.removeItem('pendingAgreementNotification');
                    setPendingAgreementNotification(null);
                    // Redirect to final agreement page
                    window.location.href = '/startup/final-agreement';
                    return;
                  }
                }
              } catch (error) {
                console.error('Error checking agreement status:', error);
              }
            }
            
            setPendingAgreementNotification(notification);
          } else {
            setPendingAgreementNotification(null);
          }
        } catch (error) {
          console.error('Error parsing pending agreement notification:', error);
          setPendingAgreementNotification(null);
        }
      } else {
        setPendingAgreementNotification(null);
      }
    };
    
    if (userData) {
      checkPendingAgreement();
      // Check every 3 seconds for updates (more frequent polling)
      const interval = setInterval(checkPendingAgreement, 3000);
      
      return () => clearInterval(interval);
    }
  }, [userData]);

  // Separate useEffect for notification and investor fetching
  useEffect(() => {
    if (userData) {
      // Fetch notifications initially
      fetchNotifications()
      
      // Fetch agreements
      fetchAgreements()
      
      // Set up interval to fetch notifications every 30 seconds
      const notificationInterval = setInterval(() => {
        fetchNotifications()
      }, 30000)
      
      // Set up interval to refresh investors if they are being shown
      const investorInterval = setInterval(() => {
        if (showInvestors) {
          fetchInvestors()
        }
      }, 60000)
      
      // Set up interval to refresh agreements every 10 seconds (more frequent for signature detection)
      const agreementInterval = setInterval(() => {
        fetchAgreements()
      }, 10000)
      
      // Cleanup intervals on unmount
      return () => {
        clearInterval(notificationInterval)
        clearInterval(investorInterval)
        clearInterval(agreementInterval)
      }
    }
  }, [userData, showInvestors])

  // Add useEffect to handle dropdown toggle
  useEffect(() => {
    const handleProfileClick = (e) => {
      const profileSection = document.querySelector('.profile-section');
      const dropdown = document.querySelector('.profile-dropdown');
      
      if (profileSection && dropdown) {
        if (profileSection.contains(e.target)) {
          // Toggle dropdown
          dropdown.classList.toggle('show');
        } else {
          // Hide dropdown when clicking elsewhere
          dropdown.classList.remove('show');
        }
      }
    };

    document.addEventListener('click', handleProfileClick);
    
    return () => {
      document.removeEventListener('click', handleProfileClick);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData && userData.email) {
        const contacts = await contactAPI.getStartupContacts(userData.email)
        setNotifications(contacts)
        const unread = contacts.filter(c => c.status === 'pending').length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchInvestors = async () => {
    setLoadingInvestors(true)
    setShowInvestors(true)
    try {
      const response = await fetch('http://localhost:5000/api/investor/all')
      const data = await response.json()
      setInvestors(data)
    } catch (error) {
      console.error('Error fetching investors:', error)
    } finally {
      setLoadingInvestors(false)
    }
  }

  const fetchAgreements = async () => {
    setLoadingAgreements(true)
    try {
      if (userData && userData._id) {
        const userAgreements = await agreementAPI.getUserAgreements(userData._id);
        // Filter for finalized agreements only
        const finalizedAgreements = userAgreements.filter(agreement => agreement.status === 'finalized');
        setAgreements(finalizedAgreements);
        
        // Check for pending agreements - show notification if OTHER party has signed
        // Also check for agreements where investor has signed (to notify startup)
        const pendingAgreements = userAgreements.filter(agreement => {
          if (!agreement.signatures || agreement.signatures.length === 0) return false;
          
          // Check if both parties have signed (with actual signature images)
          const startupSigned = agreement.signatures.some(sig => 
            sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
          );
          const investorSigned = agreement.signatures.some(sig => 
            sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
          );
          
          // If both signed, it's finalized - not pending
          if (startupSigned && investorSigned) {
            return false;
          }
          
          // Show notification if:
          // 1. Investor has signed but startup hasn't (investor signed first, notify startup)
          // 2. Startup has signed but investor hasn't (startup signed first, but we check this in investor dashboard)
          return (investorSigned && !startupSigned) || (startupSigned && !investorSigned);
        });
        
        // Check if any agreement is finalized (both parties signed) by checking signatures
        const finalizedAgreementsBySignature = userAgreements.filter(agreement => {
          if (!agreement.signatures || agreement.signatures.length === 0) return false;
          
          const startupSigned = agreement.signatures.some(sig => 
            sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
          );
          const investorSigned = agreement.signatures.some(sig => 
            sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
          );
          
          return startupSigned && investorSigned;
        });
        
        // If both parties have signed any agreement, clear notification and redirect
        if (finalizedAgreementsBySignature.length > 0) {
          console.log('✅ Both parties have signed! Clearing notification and redirecting...', {
            finalizedCount: finalizedAgreementsBySignature.length,
            agreement: finalizedAgreementsBySignature[0]
          });
          
          // Clear notification immediately
          localStorage.removeItem('pendingAgreementNotification');
          setPendingAgreementNotification(null);
          
          // Store finalized agreement for final page
          const finalizedAgreement = finalizedAgreementsBySignature[0];
          localStorage.setItem('finalizedAgreement', JSON.stringify(finalizedAgreement));
          localStorage.setItem('agreementUserType', 'startup');
          
          // Redirect to final agreement page
          setTimeout(() => {
            window.location.href = '/startup/final-agreement';
          }, 1000);
          return; // Exit early to prevent setting pending notification
        }
        
        console.log('Agreement status check:', {
          pendingCount: pendingAgreements.length,
          finalizedBySignatureCount: finalizedAgreementsBySignature.length,
          hasPendingNotification: !!localStorage.getItem('pendingAgreementNotification')
        });
        
        // Store pending agreement notification if exists and no finalized agreements
        if (pendingAgreements.length > 0) {
          const pendingAgreement = pendingAgreements[0];
          
          // Check which party has signed
          const startupSigned = pendingAgreement.signatures?.some(sig => 
            sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
          );
          const investorSigned = pendingAgreement.signatures?.some(sig => 
            sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
          );
          
          // Create appropriate notification message
          let message = '📋 Agreement initiated! A notification has been sent to the investor for review.';
          if (investorSigned && !startupSigned) {
            message = `✅ Investor has accepted the investment conditions! Please review and sign the agreement to finalize the deal.`;
          } else if (startupSigned && !investorSigned) {
            message = '📋 Agreement sent! A notification has been sent to the investor for their acceptance.';
          }
          
          // Store agreement data in localStorage for the agreement page
          localStorage.setItem('currentAgreementData', JSON.stringify(pendingAgreement));
          
          const pendingNotification = {
            agreementId: pendingAgreement._id,
            message: message,
            timestamp: new Date().toISOString(),
            userType: 'startup',
            signedBy: investorSigned ? 'investor' : (startupSigned ? 'startup' : null)
          };
          localStorage.setItem('pendingAgreementNotification', JSON.stringify(pendingNotification));
        } else {
          // Clear notification if no pending agreements
          localStorage.removeItem('pendingAgreementNotification');
          setPendingAgreementNotification(null);
        }
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoadingAgreements(false);
    }
  }

  const generateAgreementPDF = (agreement) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.text('Investment Agreement', 105, 20, null, null, 'center');
      
      // Add date
      const agreementDate = agreement.updatedAt ? new Date(agreement.updatedAt) : new Date();
      const currentDate = agreementDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFontSize(12);
      doc.text(`Date: ${currentDate}`, 105, 30, null, null, 'center');
      
      // Add parties section
      doc.setFontSize(16);
      doc.text('Parties Involved', 20, 45);
      
      doc.setFontSize(12);
      doc.text(`Startup: ${agreement.startupName || 'N/A'}`, 20, 55);
      doc.text(`Investor: ${agreement.investorName || 'N/A'}`, 20, 65);
      
      // Add investment details
      doc.setFontSize(16);
      doc.text('Investment Terms', 20, 80);
      
      doc.setFontSize(12);
      doc.text(`Investment Amount: ${agreement.investmentAmount || 'N/A'}`, 20, 90);
      doc.text(`Equity Stake: ${agreement.equityStake || 'N/A'}`, 20, 100);
      doc.text(`Valuation Cap: ${agreement.valuationCap || 'N/A'}`, 20, 110);
      
      // Add status
      doc.setFontSize(16);
      doc.text('Agreement Status', 20, 125);
      
      doc.setFontSize(12);
      doc.text(`Status: ${agreement.status ? agreement.status.toUpperCase() : 'FINALIZED'}`, 20, 135);
      
      // Add signatures section if available
      if (agreement.signatures && agreement.signatures.length > 0) {
        doc.setFontSize(16);
        doc.text('Signatures', 20, 150);
        
        let yPos = 160;
        agreement.signatures.forEach((signature, index) => {
          doc.setFontSize(12);
          doc.text(`Signature ${index + 1}:`, 20, yPos);
          doc.text(`Name: ${signature.userName || 'N/A'}`, 30, yPos + 10);
          doc.text(`Date: ${signature.timestamp ? new Date(signature.timestamp).toLocaleDateString() : 'N/A'}`, 30, yPos + 20);
          yPos += 35;
        });
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.text('This is a legally binding document once both parties have signed.', 105, 280, null, null, 'center');
      doc.text('Generated on: ' + new Date().toLocaleDateString(), 105, 285, null, null, 'center');
      
      // Save the PDF with a more robust filename
      const startupName = agreement.startupName || 'startup';
      const investorName = agreement.investorName || 'investor';
      const fileName = `investment-agreement-${startupName.replace(/\s+/g, '-')}-${investorName.replace(/\s+/g, '-')}.pdf`;
      
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const markAsRead = async (id) => {
    try {
      await contactAPI.markAsRead(id)
      // Refresh notifications after marking as read
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userData')
    localStorage.removeItem('onboardingCompleted')
    localStorage.removeItem('pitchCompleted')
    localStorage.removeItem('startupPitch')
    navigate('/startup/login')
  }

  const handleAgreeAndContinue = async () => {
    if (agreedToTerms) {
      try {
        // Save onboarding completion to database
        await startupAPI.completeOnboarding(userData.email)
        
        // Update userData with onboarding status
        const updatedUserData = { ...userData, onboardingCompleted: true }
        setUserData(updatedUserData)
        localStorage.setItem('userData', JSON.stringify(updatedUserData))
        
        setShowOnboarding(false)
      } catch (error) {
        console.error('Onboarding error:', error)
        alert('Failed to complete onboarding. Please try again.')
      }
    } else {
      alert('Please agree to the terms and conditions to continue')
    }
  }

  const handleBackToOnboarding = () => {
    localStorage.removeItem('onboardingCompleted')
    setShowOnboarding(true)
  }

  const handlePitchChange = (e) => {
    setPitchData({
      ...pitchData,
      [e.target.name]: e.target.value
    })
  }

  const handlePitchValidation = () => {
    if (!pitchData.projectTitle || !pitchData.problemSolving || !pitchData.fundingNeeded) {
      setNotificationMessage('Please fill in all fields before submitting')
      setShowNotification(true)
      return false
    }
    return true
  }

  const handleDollarChange = (e) => {
    const rupeesValue = e.target.value
    setFundingInDollars(rupeesValue)
    
    // Convert rupees to dollars
    if (rupeesValue && !isNaN(rupeesValue)) {
      const dollars = (parseFloat(rupeesValue) / USD_TO_INR_RATE).toFixed(2)
      setFundingInRupees(dollars)
      // Update pitch data with rupees value
      setPitchData({
        ...pitchData,
        fundingNeeded: `₹${parseFloat(rupeesValue).toLocaleString('en-IN')} ($${dollars} USD)`
      })
    } else {
      setFundingInRupees('')
      setPitchData({
        ...pitchData,
        fundingNeeded: ''
      })
    }
  }

  const handleNotificationClose = () => {
    setShowNotification(false)
    // Redirect to dashboard after successful submission
    if (notificationMessage.includes('successfully')) {
      setHasCompletedPitch(true)
      // Also update localStorage to ensure consistency
      localStorage.setItem('pitchCompleted', 'true')
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
      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error('Contact error:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  const handlePitchSubmit = async (e) => {
    e.preventDefault()
    // Validate all fields are filled
    if (!handlePitchValidation()) {
      return
    }
    
    try {
      
      // Save pitch data to database
      const pitchDataToSave = {
        email: userData.email,
        ...pitchData
      }
      
      const result = await startupAPI.submitPitch(pitchDataToSave)
      
      // Also save to localStorage
      localStorage.setItem('startupPitch', JSON.stringify(pitchData))
      localStorage.setItem('pitchCompleted', 'true')
      
      // Update userData to reflect pitch completion
      const updatedUserData = { ...userData, pitchCompleted: true }
      setUserData(updatedUserData)
      localStorage.setItem('userData', JSON.stringify(updatedUserData))
      
      setShowPitchForm(false)
      
      // Reset form
      setFundingInDollars('')
      setFundingInRupees('')
      
      // Fetch notifications immediately after pitch submission
      fetchNotifications()
      
      // Show success notification
      setNotificationMessage('Your pitch has been submitted successfully! Investors can now view your startup idea.')
      setShowNotification(true)
    } catch (error) {
      console.error('Pitch submission error:', error)
      setNotificationMessage(error.message || 'Failed to submit pitch. Please try again.')
      setShowNotification(true)
    }
  }

  const handleSkipToDashboard = () => {
    // Allow users to skip pitch and go directly to dashboard
    setHasCompletedPitch(true)
  }

  const handleSubmitPitchLater = () => {
    // Show pitch form when user wants to submit later
    setShowPitchForm(true)
  }

  const handleCancelPitchForm = () => {
    setShowPitchForm(false)
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  // Notification Modal
  if (showNotification) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-modal" style={{ maxWidth: '500px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
              {notificationMessage.includes('successfully') ? '✅' : '❌'}
            </div>
            <h2 style={{ color: notificationMessage.includes('successfully') ? '#27ae60' : '#e74c3c' }}>
              {notificationMessage.includes('successfully') ? 'Success!' : 'Error'}
            </h2>
          </div>
          <p style={{ 
            textAlign: 'center', 
            fontSize: '1.1rem', 
            lineHeight: '1.6',
            marginBottom: '30px',
            color: '#333'
          }}>
            {notificationMessage}
          </p>
          <button 
            onClick={handleNotificationClose}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '15px', 
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  // Onboarding Modal
  if (showOnboarding) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-modal">
          <div className="step-indicator">
            <span className="step-number">Step 1 of 2</span>
          </div>
          <h2>🚀 Welcome to Your Startup Journey!</h2>
          <div className="attraction-points">
            <h3>Why Choose Our Platform?</h3>
            <ul>
              <li>✨ <strong>Connect with Top Investors</strong> - Get access to a network of verified investors actively looking for opportunities</li>
              <li>💡 <strong>Showcase Your Ideas</strong> - Present your startup vision with detailed pitch submissions</li>
              <li>📊 <strong>Track Your Progress</strong> - Monitor profile views, investor interest, and connection requests</li>
              <li>🤝 <strong>Direct Communication</strong> - Message potential investors directly through our secure platform</li>
              <li>📈 <strong>Grow Your Network</strong> - Build valuable connections in the startup ecosystem</li>
              <li>🔒 <strong>Secure & Confidential</strong> - Your business ideas and data are protected</li>
            </ul>
          </div>

          <div className="terms-section">
            <h3>Terms & Conditions</h3>
            <div className="terms-content">
              <p>By continuing, you agree to:</p>
              <ul>
                <li>Provide accurate and truthful information about your startup</li>
                <li>Respect intellectual property and confidentiality agreements</li>
                <li>Engage professionally with investors on the platform</li>
                <li>Not use the platform for fraudulent or misleading activities</li>
                <li>Accept that investment outcomes are not guaranteed</li>
              </ul>
            </div>
            
            <div className="checkbox-container">
              <input 
                type="checkbox" 
                id="agreeTerms" 
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label htmlFor="agreeTerms">
                I have read and agree to the terms and conditions
              </label>
            </div>
          </div>

          <button 
            onClick={handleAgreeAndContinue}
            className="btn btn-primary btn-continue"
            disabled={!agreedToTerms}
          >
            Agree & Continue →
          </button>
        </div>
      </div>
    )
  }

  // Pitch Submission Form
  if (!hasCompletedPitch) {
    return (
      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <div className="nav-brand">
            <h2>🚀 {userData.companyName}</h2>
          </div>
          <div className="nav-links">
            <span className="user-name">Welcome, {userData.name}</span>
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="pitch-form-container">
            <div className="step-indicator">
              <span className="step-number">Step 2 of 2</span>
            </div>
            <h1>📝 Submit Your Startup Pitch</h1>
            <p className="pitch-subtitle">Tell investors about your innovative idea and funding needs</p>
            <p style={{ 
              background: '#e3f2fd', 
              padding: '12px', 
              borderRadius: '8px', 
              color: '#1976d2',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}>
              💡 <strong>Note:</strong> You can submit your pitch now or skip to explore the dashboard first. You can always submit your pitch later!
            </p>

            <form onSubmit={handlePitchSubmit} className="pitch-form">
              <div className="form-group">
                <label htmlFor="projectTitle">Project Title/Idea *</label>
                <textarea
                  id="projectTitle"
                  name="projectTitle"
                  value={pitchData.projectTitle}
                  onChange={handlePitchChange}
                  required
                  rows="4"
                  placeholder="Describe your project title and what makes it unique"
                />
              </div>

              <div className="form-group">
                <label htmlFor="problemSolving">Problem Solving/Description *</label>
                <textarea
                  id="problemSolving"
                  name="problemSolving"
                  value={pitchData.problemSolving}
                  onChange={handlePitchChange}
                  required
                  rows="4"
                  placeholder="What problem does your startup solve? Why is it important?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fundingNeeded">Funding Needed (in Rupees ₹) *</label>
                <input
                  type="text"
                  id="fundingNeeded"
                  name="fundingNeeded"
                  value={pitchData.fundingNeeded}
                  onChange={handlePitchChange}
                  required
                  placeholder="e.g., ₹5000000 or 50 Lakhs"
                />
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={handleBackToOnboarding}
                  className="btn btn-secondary"
                >
                  ← Back
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={handleSkipToDashboard}
                    className="btn btn-secondary"
                    title="Skip to dashboard without submitting pitch"
                  >
                    Skip to Dashboard →
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Pitch →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>🚀 {userData.companyName}</h2>
        </div>
        <div className="nav-links">
          <button onClick={() => window.history.back()} className="btn btn-secondary" style={{ marginRight: '15px' }}>
            ← Back
          </button>
          <button 
            onClick={() => navigate('/startup/notifications')}
            className={`notification-btn ${unreadCount > 0 ? 'unread' : ''}`}
            style={{ marginRight: '15px' }}
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Modern Profile Section */}
          <div className="profile-section">
            <div className="profile-avatar">
              {userData.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">
                {userData.name}
              </span>
              <span className="profile-type">
                {userData.companyName}
              </span>
            </div>
            <div className="profile-dropdown-toggle">
              ▼
            </div>
            
            {/* Dropdown Menu */}
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">
                  {userData.name}
                </div>
                <div className="profile-dropdown-email">
                  {userData.email}
                </div>
              </div>
              <button 
                onClick={() => navigate('/startup/dashboard')}
                className="profile-dropdown-item"
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => navigate('/startup/notifications')}
                className="profile-dropdown-item"
              >
                🔔 Notifications
              </button>
              <button 
                onClick={handleLogout}
                className="profile-dropdown-item logout"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Startup Dashboard</h1>
          <p>Manage your startup profile and connect with investors</p>
        </div>

        {/* Pending Agreement Notification Banner */}
        {pendingAgreementNotification && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: pendingAgreementNotification.message.includes('signed') ? '#d4edda' : '#fff3cd',
            border: `2px solid ${pendingAgreementNotification.message.includes('signed') ? '#c3e6cb' : '#ffc107'}`,
            borderRadius: '12px',
            color: pendingAgreementNotification.message.includes('signed') ? '#155724' : '#856404',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <span style={{ fontSize: '2rem' }}>
                {pendingAgreementNotification.message.includes('signed') ? '✅' : '⏳'}
              </span>
              <div>
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  color: pendingAgreementNotification.message.includes('signed') ? '#155724' : '#856404', 
                  fontSize: '1.1rem' 
                }}>
                  Agreement Update
                </h3>
                <p style={{ margin: 0, fontSize: '1rem' }}>
                  {pendingAgreementNotification.message}
                </p>
                <p style={{ 
                  margin: '5px 0 0 0', 
                  fontSize: '0.85rem', 
                  opacity: 0.8 
                }}>
                  {new Date(pendingAgreementNotification.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Agree Button - Navigate to Agreement Page */}
              {(pendingAgreementNotification.message.includes('signed') || pendingAgreementNotification.message.includes('accepted')) && (
                <button
                  onClick={() => {
                    // Store the agreement ID in localStorage for the AgreementPage to access
                    if (pendingAgreementNotification.agreementId) {
                      localStorage.setItem('currentAgreementId', pendingAgreementNotification.agreementId);
                    }
                    // Navigate to the agreement page
                    window.location.href = '/agreement';
                  }}
                  style={{
                    padding: '8px 15px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Agree & Sign
                </button>
              )}
              <button
                onClick={() => {
                  setPendingAgreementNotification(null);
                  localStorage.removeItem('pendingAgreementNotification');
                }}
                style={{
                  padding: '8px 15px',
                  background: pendingAgreementNotification.message.includes('signed') ? '#28a745' : '#ffc107',
                  color: pendingAgreementNotification.message.includes('signed') ? 'white' : '#856404',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.opacity = '0.9';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {/* Dashboard Cards - Flexbox Side-by-Side Layout */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          marginTop: '40px',
          padding: '0 8px'
        }}>
          
          {/* Show Pitch Submission Card if user hasn't submitted pitch */}
          {!userData.pitchCompleted && !showPitchForm && (
            <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div className="card-icon" style={{ fontSize: '3rem' }}>📝</div>
              <h3 style={{ color: 'white' }}>Submit Your Pitch</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)' }}>Tell investors about your startup idea and attract funding!</p>
              <button 
                onClick={handleSubmitPitchLater}
                className="btn btn-primary"
                style={{ background: 'white', color: '#667eea', fontWeight: 'bold' }}
              >
                📝 Create Your Pitch Now
              </button>
            </div>
          )}

          {/* Pitch Form Modal/Card */}
          {showPitchForm && (
            <div className="dashboard-card" style={{ gridColumn: '1 / -1', padding: '30px' }}>
              <h2 style={{ color: '#667eea', marginBottom: '10px' }}>📝 Submit Your Startup Pitch</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>Tell investors about your innovative idea and funding needs</p>
              
              <form onSubmit={handlePitchSubmit}>
                <div className="form-group">
                  <label htmlFor="projectTitle">Project Title/Idea *</label>
                  <textarea
                    id="projectTitle"
                    name="projectTitle"
                    value={pitchData.projectTitle}
                    onChange={handlePitchChange}
                    required
                    rows="4"
                    placeholder="Describe your project title and what makes it unique"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="problemSolving">Problem Solving/Description *</label>
                  <textarea
                    id="problemSolving"
                    name="problemSolving"
                    value={pitchData.problemSolving}
                    onChange={handlePitchChange}
                    required
                    rows="4"
                    placeholder="What problem does your startup solve? Why is it important?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fundingInDollars">Funding Needed (in Rupees ₹) *</label>
                  <input
                    type="number"
                    id="fundingInDollars"
                    name="fundingInDollars"
                    value={fundingInDollars}
                    onChange={handleDollarChange}
                    required
                    placeholder="e.g., ₹5000000"
                    min="0"
                    step="10000"
                  />
                  {fundingInRupees && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1rem',
                      textAlign: 'center'
                    }}>
                      💰 Rupees Amount: ₹{parseFloat(fundingInDollars).toLocaleString('en-IN')} 
                      <span style={{ fontSize: '0.85rem', opacity: '0.9', display: 'block', marginTop: '4px' }}>
                        (Equivalent to ${parseFloat(fundingInRupees).toLocaleString('en-US')} USD)
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={handleCancelPitchForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Pitch →
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Profile Card */}
          <div className="dashboard-card" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #f0f0f0',
            transition: 'all 0.3s ease',
            flex: '1 1 calc(50% - 12px)',
            minWidth: '300px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
            e.currentTarget.style.borderColor = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#f0f0f0';
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Profile</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Your startup information</p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '12px',
              fontSize: '0.9rem'
            }}>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Company:</strong> {userData.companyName}</p>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Name:</strong> {userData.name}</p>
              <p style={{ marginBottom: '0' }}><strong style={{ color: '#667eea' }}>Email:</strong> {userData.email}</p>
            </div>
          </div>

          {/* Find Investors Card */}
          <div className="dashboard-card" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #f0f0f0',
            transition: 'all 0.3s ease',
            flex: '1 1 calc(50% - 12px)',
            minWidth: '300px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
            e.currentTarget.style.borderColor = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#f0f0f0';
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💼</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Find Investors</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Connect with potential investors</p>
            <Link 
              to="/startup/browse-investors"
              className="btn btn-primary"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}
            >
              View Available Investors
            </Link>
          </div>

          {/* Investor Interest Card */}
          <div className="dashboard-card" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '2px solid #f0f0f0',
            transition: 'all 0.3s ease',
            flex: '1 1 calc(50% - 12px)',
            minWidth: '300px',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
            e.currentTarget.style.borderColor = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = '#f0f0f0';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
                <h3 style={{ color: '#667eea', margin: '0', fontSize: '1.2rem' }}>Investor Interest</h3>
              </div>
              <button 
                onClick={fetchNotifications}
                className="btn btn-secondary"
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '0.85rem',
                  borderRadius: '8px'
                }}
                title="Refresh notifications"
              >
                🔄 Refresh
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Messages from investors for <strong style={{ color: '#667eea' }}>{userData.companyName}</strong></p>
            {unreadCount > 0 && (
              <div style={{
                background: '#ff4757',
                color: 'white',
                borderRadius: '20px',
                padding: '6px 16px',
                display: 'inline-block',
                marginBottom: '16px',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}>
                🔔 {unreadCount} New Message{unreadCount > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px', 
                  background: '#f8f9fa', 
                  borderRadius: '12px',
                  color: '#999' 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📫</div>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>No investor messages yet. Keep building your pitch!</p>
                </div>
              ) : (
                notifications.slice(0, 3).map(notification => (
                  <div 
                    key={notification._id} 
                    style={{
                      background: notification.status === 'pending' ? '#e3f2fd' : '#f8f9fa',
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      borderLeft: notification.status === 'pending' ? '4px solid #667eea' : 'none',
                      transition: 'all 0.2s',
                      cursor: notification.status === 'pending' ? 'pointer' : 'default',
                      // Highlight investment offers with special border
                      ...(notification.message && notification.message.includes('INVESTMENT OFFER') ? {
                        borderLeft: '4px solid #28a745',
                        background: '#d4edda'
                      } : {})
                    }}
                    onClick={() => notification.status === 'pending' && markAsRead(notification._id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong style={{ color: '#667eea', fontSize: '1rem' }}>💼 {notification.investorName}</strong>
                      {notification.status === 'pending' && (
                        <span style={{
                          background: '#ff4757',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#999', margin: '4px 0' }}>
                      {notification.investorEmail}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '12px 0', lineHeight: '1.5' }}>
                      {notification.message.substring(0, 120)}{notification.message.length > 120 ? '...' : ''}
                    </p>
                    {/* Check if this is an investment offer */}
                    {notification.message && notification.message.includes('INVESTMENT OFFER') && (
                      <div style={{
                        background: '#c3e6cb',
                        border: '1px solid #28a745',
                        borderRadius: '8px',
                        padding: '10px',
                        marginTop: '10px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontWeight: 'bold',
                          color: '#155724'
                        }}>
                          <span>📈</span>
                          <span>Investment Offer Received!</span>
                        </div>
                      </div>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>
                      📅 {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 3 && (
              <button className="btn btn-primary" style={{ marginTop: '16px', width: '100%', padding: '12px', borderRadius: '8px' }}>
                View All {notifications.length} Messages
              </button>
            )}
          </div>
        </div>

        {/* Finalized Agreements Card */}
        <div className="dashboard-card" style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #f0f0f0',
          transition: 'all 0.3s ease',
          flex: '1 1 calc(50% - 12px)',
          minWidth: '300px',
          boxSizing: 'border-box',
          marginTop: '24px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
          e.currentTarget.style.borderColor = '#667eea';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#f0f0f0';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📜</div>
              <h3 style={{ color: '#667eea', margin: '0', fontSize: '1.2rem' }}>Finalized Agreements</h3>
            </div>
            <button 
              onClick={fetchAgreements}
              className="btn btn-secondary"
              style={{ 
                padding: '8px 16px', 
                fontSize: '0.85rem',
                borderRadius: '8px'
              }}
              title="Refresh agreements"
            >
              🔄 Refresh
            </button>
          </div>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Your finalized investment agreements</p>
          {loadingAgreements ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Loading agreements...</p>
            </div>
          ) : agreements.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '32px', 
              background: '#f8f9fa', 
              borderRadius: '12px',
              color: '#999' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</div>
              <p style={{ fontSize: '0.9rem', margin: '0 0 10px 0' }}>No finalized agreements yet</p>
              <p style={{ fontSize: '0.8rem', margin: 0, color: '#666' }}>Finalized agreements will appear here after both parties sign</p>
            </div>
          ) : (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {agreements.map(agreement => (
                <div 
                  key={agreement._id} 
                  style={{
                    background: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    borderLeft: '4px solid #28a745',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <strong style={{ color: '#667eea', fontSize: '1rem' }}>💼 {agreement.investorName}</strong>
                    <span style={{
                      background: '#28a745',
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      FINALIZED
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#666', margin: '12px 0', lineHeight: '1.5' }}>
                    <strong>Investment Amount:</strong> {agreement.investmentAmount}<br />
                    <strong>Equity Stake:</strong> {agreement.equityStake}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    📅 {new Date(agreement.updatedAt).toLocaleDateString()}
                  </span>
                  <div style={{ marginTop: '10px' }}>
                    <button 
                      onClick={() => generateAgreementPDF(agreement)}
                      className="btn btn-primary"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.8rem',
                        borderRadius: '6px'
                      }}
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Investors Section */}
        {showInvestors && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ color: '#667eea', marginBottom: '20px' }}>💼 Available Investors</h2>
            {loadingInvestors ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
                <p>Loading investors...</p>
              </div>
            ) : investors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
                <h3 style={{ color: '#667eea' }}>No investors available yet</h3>
                <p style={{ color: '#666' }}>Check back later to discover investment opportunities!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {investors.map((investor) => (
                  <div key={investor._id} className="startup-card">
                    <div className="startup-header">
                      <h2>💼 {investor.fullName}</h2>
                      <span className="founder-badge">{investor.investorType}</span>
                    </div>
                    
                    <div className="pitch-details">
                      <div className="pitch-section">
                        <h3>📧 Contact</h3>
                        <p>{investor.email}</p>
                      </div>

                      <div className="pitch-section">
                        <h3>💰 Investment Range</h3>
                        <p className="funding-amount">{investor.investmentRange}</p>
                      </div>

                      <div className="pitch-section">
                        <h3>🏭 Preferred Industries</h3>
                        <p>{investor.preferredIndustries}</p>
                      </div>

                      <div className="pitch-section">
                        <h3>📝 About</h3>
                        <p>{investor.about}</p>
                      </div>
                    </div>

                    <div className="startup-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setContactingInvestor(investor)
                          setContactMessage('')
                        }}
                      >
                        📧 Contact Investor
                      </button>
                      <button className="btn btn-secondary">
                        ⭐ Save for Later
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default StartupDashboard