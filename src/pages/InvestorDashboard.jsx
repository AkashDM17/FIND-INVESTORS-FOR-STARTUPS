import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { investorAPI, contactAPI, agreementAPI } from '../api/api'
import { jsPDF } from "jspdf";
import '../styles/Dashboard.css'

function InvestorDashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [contactingStartup, setContactingStartup] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [startups, setStartups] = useState([])
  const [savedStartupsCount, setSavedStartupsCount] = useState(0)
  const [agreements, setAgreements] = useState([])
  const [loadingAgreements, setLoadingAgreements] = useState(false)
  const [pendingAgreementNotification, setPendingAgreementNotification] = useState(null)

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
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)
      
      // Check onboarding status from database (in userData)
      if (parsedUserData.onboardingCompleted) {
        setShowOnboarding(false)
      } else {
        setShowOnboarding(true)
      }
    }
  }, [navigate])

  // Add useEffect to refresh data when the dashboard becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userData) {
        fetchSavedStartupsCount()
        fetchAgreements()
        fetchNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh when the component mounts
    if (userData) {
      fetchSavedStartupsCount()
      fetchAgreements()
      fetchNotifications()
      
      // Check if we need to refresh dashboard data due to agreement submission
      const refreshNeeded = localStorage.getItem('dashboardRefreshNeeded')
      if (refreshNeeded === 'true') {
        fetchNotifications()
        fetchSavedStartupsCount()
        localStorage.removeItem('dashboardRefreshNeeded')
      }
      
      // Clean up old agreed startups (older than 30 days)
      try {
        const storedAgreedStartups = localStorage.getItem('agreedStartups');
        if (storedAgreedStartups) {
          const agreedStartups = JSON.parse(storedAgreedStartups);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const filteredAgreedStartups = agreedStartups.filter(agreed => {
            const agreedDate = new Date(agreed.agreedAt);
            return agreedDate > thirtyDaysAgo;
          });
          
          if (filteredAgreedStartups.length !== agreedStartups.length) {
            localStorage.setItem('agreedStartups', JSON.stringify(filteredAgreedStartups));
          }
        }
      } catch (error) {
        console.error('Error cleaning up agreed startups:', error);
      }
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userData])

  // Check for pending agreement notification and verify if both parties have signed
  useEffect(() => {
    const checkPendingAgreement = async () => {
      const storedNotification = localStorage.getItem('pendingAgreementNotification');
      if (storedNotification) {
        try {
          const notification = JSON.parse(storedNotification);
          // Show notification if it's for investor user type OR if startup has signed (cross-dashboard)
          if (notification.userType === 'investor' || notification.signedBy === 'startup') {
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
                    window.location.href = '/investor/final-agreement';
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

  // Separate useEffect for notification and startup fetching
  useEffect(() => {
    if (userData) {
      // Fetch notifications and startups initially
      fetchNotifications()
      fetchStartups()
      fetchSavedStartupsCount()
      fetchAgreements()
      
      // Set up interval to fetch notifications every 30 seconds
      const notificationInterval = setInterval(() => {
        fetchNotifications()
      }, 30000)
      
      // Set up interval to refresh agreements every 10 seconds (more frequent for signature detection)
      const agreementInterval = setInterval(() => {
        fetchAgreements()
        // Also refresh saved startups count in case any were removed
        fetchSavedStartupsCount()
      }, 10000)
      
      // Cleanup interval on unmount
      return () => {
        clearInterval(notificationInterval)
        clearInterval(agreementInterval)
      }
    }
  }, [userData])

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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userData')
    localStorage.removeItem('investorOnboardingCompleted')
    navigate('/investor/login')
  }

  const handleAgreeAndContinue = async () => {
    if (agreedToTerms) {
      try {
        // Save onboarding completion to database
        await investorAPI.completeOnboarding(userData.email)
        
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

  const handleBackToLogin = () => {
    handleLogout()
  }

  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData && userData.email) {
        const contacts = await contactAPI.getInvestorContacts(userData.email)
        
        // Get agreed startups from localStorage to filter notifications
        let agreedStartups = [];
        try {
          const storedAgreedStartups = localStorage.getItem('agreedStartups');
          if (storedAgreedStartups) {
            agreedStartups = JSON.parse(storedAgreedStartups);
          }
        } catch (error) {
          console.error('Error parsing agreed startups:', error);
        }
        
        // Filter out notifications from startups that have been agreed upon
        const filteredContacts = contacts.filter(contact => {
          // Check if this startup has been agreed upon
          const isAgreedStartup = agreedStartups.some(agreed => 
            agreed.startupName === contact.startupName
          );
          
          // Only show contact if it's not an agreed startup
          return !isAgreedStartup;
        });
        
        setNotifications(filteredContacts)
        const unread = filteredContacts.filter(c => c.status === 'pending').length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchStartups = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/startup/all')
      const data = await response.json()
      setStartups(data)
    } catch (error) {
      console.error('Error fetching startups:', error)
    }
  }

  const fetchSavedStartupsCount = () => {
    const savedStartups = localStorage.getItem('savedStartups')
    if (savedStartups) {
      try {
        const count = JSON.parse(savedStartups).length
        setSavedStartupsCount(count)
      } catch (error) {
        console.error('Error parsing saved startups:', error)
        setSavedStartupsCount(0)
      }
    } else {
      setSavedStartupsCount(0)
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
        // Also check for agreements where startup has signed (to notify investor)
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
          // 1. Startup has signed but investor hasn't (startup signed first, notify investor)
          // 2. Investor has signed but startup hasn't (investor signed first, but we check this in startup dashboard)
          return (startupSigned && !investorSigned) || (investorSigned && !startupSigned);
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
          localStorage.setItem('agreementUserType', 'investor');
          
          // Redirect to final agreement page
          setTimeout(() => {
            window.location.href = '/investor/final-agreement';
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
          let message = 'Agreement successfully submitted! Waiting for the other party to sign.';
          if (startupSigned && !investorSigned) {
            message = `Startup has signed the agreement! Please sign to complete the process.`;
          } else if (investorSigned && !startupSigned) {
            message = 'Agreement successfully submitted! Waiting for the startup to sign.';
          }
          
          const pendingNotification = {
            agreementId: pendingAgreement._id,
            message: message,
            timestamp: new Date().toISOString(),
            userType: 'investor',
            signedBy: startupSigned ? 'startup' : (investorSigned ? 'investor' : null)
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
      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error('Contact error:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  // Convert dollar investment range to Rupees or Lakhs
  const convertDollarToRupees = (investmentRange) => {
    // Conversion rate: $1 = ₹83 (approximate)
    const USD_TO_INR_RATE = 83
    
    // Map dollar ranges to Rupee ranges
    const conversionMap = {
      '10k-50k': '₹8.3L - ₹41.5L (₹8,30,000 - ₹41,50,00,00)',
      '50k-100k': '₹41.5L - ₹83L (₹41,50,000 - ₹83,00,000)',
      '100k-500k': '₹83L - ₹415L (₹83,00,000 - ₹41,50,00,000)',
      '500k-1m': '₹415L - ₹830L (₹41,50,00,000 - ₹83,00,00,000)',
      '1m-plus': '₹830L+ (₹83,00,00,000+)'
    }
    
    // Return converted value or original if not found
    return conversionMap[investmentRange] || investmentRange
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  // Onboarding Modal for Investors
  if (showOnboarding) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-modal">
          <h2>💼 Welcome to Investor Portal!</h2>
          <div className="attraction-points">
            <h3>Why Invest Through Our Platform?</h3>
            <ul>
              <li>🚀 <strong>Discover Promising Startups</strong> - Access a curated selection of innovative startups seeking investment</li>
              <li>📊 <strong>Detailed Pitch Information</strong> - Review comprehensive business ideas, problem statements, and funding requirements</li>
              <li>💬 <strong>Direct Communication</strong> - Connect and communicate directly with startup founders</li>
              <li>🔍 <strong>Advanced Search & Filtering</strong> - Find startups that match your investment criteria and interests</li>
              <li>📈 <strong>Track Your Portfolio</strong> - Monitor and manage all your investments in one place</li>
              <li>🔒 <strong>Secure Platform</strong> - Your investment data and communications are protected</li>
              <li>🤝 <strong>Build Relationships</strong> - Network with entrepreneurs and fellow investors</li>
            </ul>
          </div>

          <div className="terms-section">
            <h3>Terms & Conditions</h3>
            <div className="terms-content">
              <p>By continuing, you agree to:</p>
              <ul>
                <li>Conduct investment activities in accordance with applicable laws and regulations</li>
                <li>Maintain confidentiality of sensitive startup information</li>
                <li>Engage professionally and ethically with startups and founders</li>
                <li>Understand that all investment decisions carry risk</li>
                <li>Not use the platform for fraudulent or misleading activities</li>
                <li>Provide accurate information about your investment capacity and interests</li>
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
            Agree & Continue to Search Startups →
          </button>
          
          <button 
            onClick={handleBackToLogin}
            className="btn btn-secondary"
            style={{ marginTop: '10px', width: '100%' }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>💼 Investor Dashboard</h2>
        </div>
        <div className="nav-links">
          <button 
            onClick={() => navigate('/investor/notifications')}
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
              {userData.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">
                {userData.fullName}
              </span>
              <span className="profile-type">
                {userData.investorType}
              </span>
            </div>
            <div className="profile-dropdown-toggle">
              ▼
            </div>
            
            {/* Dropdown Menu */}
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">
                  {userData.fullName}
                </div>
                <div className="profile-dropdown-email">
                  {userData.email}
                </div>
              </div>
              <button 
                onClick={() => navigate('/investor/dashboard')}
                className="profile-dropdown-item"
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => navigate('/investor/notifications')}
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
          <h1>Investor Dashboard</h1>
          <p>Discover and invest in promising startups</p>
        </div>

        {/* Pending Agreement Notification Banner */}
        {pendingAgreementNotification && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#856404', fontSize: '1.1rem' }}>
                  Agreement Status
                </h3>
                <p style={{ margin: 0, fontSize: '1rem' }}>
                  {pendingAgreementNotification.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPendingAgreementNotification(null);
                localStorage.removeItem('pendingAgreementNotification');
              }}
              style={{
                padding: '8px 15px',
                background: '#ffc107',
                color: '#856404',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕ Dismiss
            </button>
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
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👤</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Profile</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Manage your investor profile</p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '12px',
              fontSize: '0.9rem'
            }}>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Name:</strong> {userData.fullName}</p>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Email:</strong> {userData.email}</p>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Type:</strong> {userData.investorType}</p>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: '#667eea' }}>Investment Range:</strong> {convertDollarToRupees(userData.investmentRange)}</p>
              <p style={{ marginBottom: '0' }}><strong style={{ color: '#667eea' }}>Preferred Industries:</strong> {userData.preferredIndustries}</p>
            </div>
          </div>

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
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚀</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Browse Startups</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Explore startups looking for investment</p>
            <Link to="/investor/browse-startups" className="btn btn-primary" style={{
              display: 'block',
              textAlign: 'center',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              View Startups
            </Link>
          </div>

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
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⭐</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Saved Startups</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>View your bookmarked startups</p>
            <Link to="/investor/saved-startups" className="btn btn-primary" style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center'
            }}>
              View Saved {savedStartupsCount > 0 && `(${savedStartupsCount})`}
            </Link>
          </div>

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
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📧</div>
            <h3 style={{ color: '#667eea', marginBottom: '8px', fontSize: '1.2rem' }}>Contact Startups</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Send messages to startups directly</p>
            <button 
              className="btn btn-primary" 
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}
              onClick={() => {
                // This would open a modal or take to a page to select startups
                // For now, we'll direct to the browse startups page
                window.location.href = '/investor/browse-startups'
              }}
            >
              Contact Startups
            </button>
          </div>

          {/* Messages and Finalized Agreements sections are now hidden */}
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <h2>💼 Welcome to Investor Portal!</h2>
            <div className="attraction-points">
              <h3>Why Invest Through Our Platform?</h3>
              <ul>
                <li>🚀 <strong>Discover Promising Startups</strong> - Access a curated selection of innovative startups seeking investment</li>
                <li>📊 <strong>Detailed Pitch Information</strong> - Review comprehensive business ideas, problem statements, and funding requirements</li>
                <li>💬 <strong>Direct Communication</strong> - Connect and communicate directly with startup founders</li>
                <li>🔍 <strong>Advanced Search & Filtering</strong> - Find startups that match your investment criteria and interests</li>
                <li>📈 <strong>Track Your Portfolio</strong> - Monitor and manage all your investments in one place</li>
                <li>🔒 <strong>Secure Platform</strong> - Your investment data and communications are protected</li>
                <li>🤝 <strong>Build Relationships</strong> - Network with entrepreneurs and fellow investors</li>
              </ul>
            </div>

            <div className="terms-section">
              <h3>Terms & Conditions</h3>
              <div className="terms-content">
                <p>By continuing, you agree to:</p>
                <ul>
                  <li>Conduct investment activities in accordance with applicable laws and regulations</li>
                  <li>Maintain confidentiality of sensitive startup information</li>
                  <li>Engage professionally and ethically with startups and founders</li>
                  <li>Understand that all investment decisions carry risk</li>
                  <li>Not use the platform for fraudulent or misleading activities</li>
                  <li>Provide accurate information about your investment capacity and interests</li>
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
              Agree & Continue to Search Startups →
            </button>
            
            <button 
              onClick={handleBackToLogin}
              className="btn btn-secondary"
              style={{ marginTop: '10px', width: '100%' }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestorDashboard