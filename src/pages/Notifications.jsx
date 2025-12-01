import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { contactAPI, agreementAPI } from '../api/api'
import '../styles/Dashboard.css'
import AgreementButton from '../components/AgreementButton';
import AgreementPage from '../components/AgreementPage';
import InvestmentOfferForm from '../components/InvestmentOfferForm';
import { jsPDF } from "jspdf";

function Notifications() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [userType, setUserType] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementData, setAgreementData] = useState(null);
  const [agreementId, setAgreementId] = useState(null);
  const [messagePollingInterval, setMessagePollingInterval] = useState(null); // Add this state
  const [showInvestmentOffer, setShowInvestmentOffer] = useState(false); // Add this state

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const storedUserData = localStorage.getItem('userData')

    if (!token || !storedUserData) {
      if (userType === 'startup') {
        navigate('/startup/login')
      } else {
        navigate('/investor/login')
      }
      return
    }

    const parsedUserData = JSON.parse(storedUserData)
    setUserData(parsedUserData)
    setUserType(userType)

    // Fetch notifications
    fetchNotifications()
    
    // Cleanup function to clear intervals
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, [navigate])

  // Add useEffect to handle message polling when there's an active chat
  useEffect(() => {
    // Clear any existing interval
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
    }
    
    // Set up polling for messages if there's an active chat
    if (activeChat) {
      const interval = setInterval(() => {
        fetchMessages(activeChat.conversationId);
      }, 5000); // Poll every 5 seconds
      
      setMessagePollingInterval(interval);
      
      // Cleanup this interval when component unmounts or activeChat changes
      return () => {
        clearInterval(interval);
      };
    }
  }, [activeChat]);

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

  // Add useEffect to handle agreement data polling when an agreement is shown
  useEffect(() => {
    let intervalId;
    
    if (showAgreement && agreementId) {
      // Fetch agreement data immediately
      const fetchAgreementData = async () => {
        try {
          const updatedAgreement = await agreementAPI.getAgreement(agreementId);
          console.log('Notifications - Fetched updated agreement data:', updatedAgreement);
          
          // Always update the agreement data to ensure we have the latest
          setAgreementData(updatedAgreement);
          
          // Check if both parties have signed
          if (updatedAgreement.signatures && updatedAgreement.signatures.length >= 2) {
            const hasValidStartupSignature = updatedAgreement.signatures.some(sig => sig.userType === 'startup' && sig.signature);
            const hasValidInvestorSignature = updatedAgreement.signatures.some(sig => sig.userType === 'investor' && sig.signature);
            
            if (hasValidStartupSignature && hasValidInvestorSignature) {
              console.log('Both parties have signed the agreement in Notifications');
            }
          }
        } catch (error) {
          console.error('Error fetching agreement in Notifications:', error);
        }
      };
      
      fetchAgreementData();
      
      // Set up polling for agreement updates
      intervalId = setInterval(fetchAgreementData, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showAgreement, agreementId]);
  
  // Remove the duplicate polling useEffect
  /*
  // Add polling to refresh agreement data
  useEffect(() => {
    let intervalId;
    
    if (showAgreement && agreementId) {
      // Poll for agreement updates every 5 seconds
      intervalId = setInterval(async () => {
        try {
          const updatedAgreement = await agreementAPI.getAgreement(agreementId);
          console.log('Polling - Updated agreement data:', updatedAgreement);
          setAgreementData(updatedAgreement);
        } catch (error) {
          console.error('Error polling agreement data:', error);
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showAgreement, agreementId]);
  */

  // Add useEffect to check if agreement is finalized and download PDF automatically
  useEffect(() => {
    if (agreementData && agreementData.status === 'finalized' && !agreementData.pdfDownloaded) {
      // Mark that we've handled the PDF download to prevent multiple downloads
      agreementData.pdfDownloaded = true;
      
      // Show alert that agreement is finalized
      alert('The agreement has been finalized by both parties! The PDF will be downloaded automatically.');
      
      // Here you would typically trigger the PDF download
      // For now, we'll just log it
      console.log('Agreement finalized, PDF should be downloaded');
    }
  }, [agreementData]);

  const fetchNotifications = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData && userData.email) {
        let contacts
        if (localStorage.getItem('userType') === 'startup') {
          contacts = await contactAPI.getStartupContacts(userData.email)
        } else {
          contacts = await contactAPI.getInvestorContacts(userData.email)
        }
        setNotifications(contacts)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Add a new function to fetch messages
  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const conversationMessages = await contactAPI.getMessages(conversationId)
      
      // Format messages for display
      const formattedMessages = conversationMessages.map(msg => ({
        id: msg._id,
        sender: msg.senderName,
        message: msg.content,
        timestamp: msg.createdAt,
        isOwn: msg.senderId === userData._id,
        file: msg.filePath ? `http://localhost:5000/api/messages/file/${msg.filePath}` : null,
        fileName: msg.fileName || null,
        fileType: msg.fileType || null
      }))
      
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await contactAPI.markAsRead(id)
      // Refresh notifications after marking as read
      fetchNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Add PDF generation function
  const generateAgreementPDF = () => {
    if (!agreementData) {
      alert('No agreement data available to generate PDF');
      return;
    }
    
    console.log('Generating PDF with agreement data:', agreementData);
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.text('Investment Agreement', 105, 20, null, null, 'center');
    
    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 105, 30, null, null, 'center');
    
    // Add agreement ID
    doc.setFontSize(10);
    doc.text(`Agreement ID: ${agreementData._id || 'N/A'}`, 105, 35, null, null, 'center');
    
    // Add startup details section
    doc.setFontSize(16);
    doc.text('Startup Details', 20, 50);
    
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);
    
    doc.setFontSize(12);
    doc.text(`Company Name: ${agreementData.startupName || 'N/A'}`, 20, 62);
    doc.text(`Project Title: ${agreementData.ideaTitle || 'N/A'}`, 20, 72);
    doc.text(`Funding Amount Requested: ${agreementData.fundingAmountRequested || 'N/A'}`, 20, 82);
    doc.text(`Current Valuation: ${agreementData.currentValuation || 'N/A'}`, 20, 92);
    
    // Add investor details section
    doc.setFontSize(16);
    doc.text('Investor Details', 20, 117);
    
    doc.setLineWidth(0.5);
    doc.line(20, 119, 190, 119);
    
    doc.setFontSize(12);
    doc.text(`Investor Name: ${agreementData.investorName || 'N/A'}`, 20, 129);
    doc.text(`Investor Type: ${agreementData.investorType || 'Venture Capital'}`, 20, 139);
    doc.text(`Investment Range: ${agreementData.investmentRange || '$100K - $1M'}`, 20, 149);
    doc.text(`Investment Amount: ${agreementData.investmentAmount || '$100,000'}`, 20, 159);
    doc.text(`Ownership Percentage: ${agreementData.equityStake || '10%'}`, 20, 169);
    doc.text(`Valuation Cap: ${agreementData.valuationCap || '$1,000,000'}`, 20, 179);
    
    // Add terms and conditions
    doc.setFontSize(16);
    doc.text('Terms and Conditions', 20, 194);
    
    doc.setLineWidth(0.5);
    doc.line(20, 196, 190, 196);
    
    doc.setFontSize(12);
    doc.text('Startup Terms:', 20, 206);
    doc.text('- The Startup agrees to provide equity as specified above', 25, 216);
    doc.text('- Both parties agree to complete all necessary legal requirements', 25, 226);
    doc.text('- Confidentiality of proprietary information is maintained', 25, 236);
    doc.text('- Agreement governed by applicable laws and regulations', 25, 246);
    
    doc.text('Investor Terms:', 20, 256);
    doc.text('- The Investor agrees to provide funding as specified', 25, 266);
    doc.text('- Investor receives equity stake as outlined in agreement', 25, 276);
    doc.text('- Investor rights and obligations are as per company policies', 25, 286);
    
    // Add a new page for signatures
    doc.addPage();
    
    // Add signatures section
    doc.setFontSize(16);
    doc.text('Signatures', 105, 20, null, null, 'center');
    
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Startup Signature
    doc.setFontSize(14);
    doc.text('Startup Representative:', 20, 40);
    doc.setFontSize(12);
    doc.text(`Name: ${agreementData.startupName || 'N/A'}`, 20, 50);
    doc.text(`Date: ${currentDate}`, 20, 60);
    doc.text('Signature:', 20, 70);
    
    // Add startup signature if available
    const startupSignature = agreementData.signatures?.find(sig => sig.userType === 'startup');
    console.log('Startup signature data (Notifications):', startupSignature);
    
    if (startupSignature && startupSignature.signature) {
      try {
        doc.addImage(startupSignature.signature, 'PNG', 20, 75, 60, 20);
        doc.setFontSize(10);
        doc.text(`Signed by: ${startupSignature.userName || 'N/A'}`, 20, 100);
        doc.text(`Signed on: ${startupSignature.timestamp ? new Date(startupSignature.timestamp).toLocaleString() : 'N/A'}`, 20, 105);
        doc.text(`User ID: ${startupSignature.userId || 'N/A'}`, 20, 110);
      } catch (error) {
        console.error('Error adding startup signature to PDF:', error);
        doc.setFontSize(10);
        doc.text('Error loading signature', 20, 85);
      }
    } else {
      doc.setFontSize(10);
      doc.text('Pending signature', 20, 85);
      doc.setLineWidth(0.5);
      doc.line(20, 90, 100, 90); // Signature line
    }
    
    // Investor Signature
    doc.setFontSize(14);
    doc.text('Investor Representative:', 20, 130);
    doc.setFontSize(12);
    doc.text(`Name: ${agreementData.investorName || 'N/A'}`, 20, 140);
    doc.text(`Date: ${currentDate}`, 20, 150);
    doc.text('Signature:', 20, 160);
    
    // Add investor signature if available
    const investorSignature = agreementData.signatures?.find(sig => sig.userType === 'investor');
    console.log('Investor signature data (Notifications):', investorSignature);
    
    if (investorSignature && investorSignature.signature) {
      try {
        doc.addImage(investorSignature.signature, 'PNG', 20, 165, 60, 20);
        doc.setFontSize(10);
        doc.text(`Signed by: ${investorSignature.userName || 'N/A'}`, 20, 190);
        doc.text(`Signed on: ${investorSignature.timestamp ? new Date(investorSignature.timestamp).toLocaleString() : 'N/A'}`, 20, 195);
        doc.text(`User ID: ${investorSignature.userId || 'N/A'}`, 20, 200);
      } catch (error) {
        console.error('Error adding investor signature to PDF:', error);
        doc.setFontSize(10);
        doc.text('Error loading signature', 20, 175);
      }
    } else {
      doc.setFontSize(10);
      doc.text('Pending signature', 20, 175);
      doc.setLineWidth(0.5);
      doc.line(20, 180, 100, 180); // Signature line
    }
    
    // Add agreement terms confirmation
    doc.setFontSize(12);
    doc.text('Both parties acknowledge and agree to the terms outlined in this agreement.', 20, 220);
    doc.text('This document is legally binding upon the signatures of both parties.', 20, 230);
    
    // Add status information
    doc.setFontSize(10);
    const signedParties = [];
    if (startupSignature && startupSignature.signature) signedParties.push('Startup');
    if (investorSignature && investorSignature.signature) signedParties.push('Investor');
    
    if (signedParties.length > 0) {
      doc.text(`Status: ${signedParties.join(' and ')} signed`, 20, 240);
    } else {
      doc.text('Status: No signatures yet', 20, 240);
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.text('This document represents a legally binding agreement between the parties.', 105, 280, null, null, 'center');
    doc.text(`Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()}`, 105, 285, null, null, 'center');
    
    // Save the PDF
    doc.save(`investment-agreement-${agreementData.startupName || 'startup'}-${agreementData.investorName || 'investor'}.pdf`);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read when clicked
    if (notification.status === 'pending') {
      markAsRead(notification._id)
    }
    
    // Fetch additional startup and investor details
    let enrichedNotification = { ...notification };
    
    try {
      // Fetch startup details
      const startupResponse = await fetch(`http://localhost:5000/api/startup/${notification.startupEmail}`);
      if (startupResponse.ok) {
        const startupData = await startupResponse.json();
        enrichedNotification.projectTitle = startupData.projectTitle;
        enrichedNotification.startupDescription = startupData.description;
      }
      
      // Fetch investor details
      const investorResponse = await fetch(`http://localhost:5000/api/investor/${notification.investorEmail}`);
      if (investorResponse.ok) {
        const investorData = await investorResponse.json();
        enrichedNotification.investorType = investorData.investorType;
        enrichedNotification.investmentRange = investorData.investmentRange;
      }
    } catch (error) {
      console.warn('Could not fetch additional details:', error);
    }
    
    // Set active chat with enriched data
    setActiveChat(enrichedNotification)
    
    // Fetch actual conversation messages
    await fetchMessages(notification.conversationId);
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeChat) return

    try {
      // Determine receiver based on user type
      let receiverId, receiverName, receiverType
      if (userType === 'startup') {
        // If current user is startup, receiver is the investor
        receiverId = activeChat.investorId
        receiverName = activeChat.investorName
        receiverType = 'investor'
      } else {
        // If current user is investor, receiver is the startup
        receiverId = activeChat.startupId
        receiverName = activeChat.startupName
        receiverType = 'startup'
      }

      const messageData = {
        senderId: userData._id,
        senderName: userType === 'startup' ? userData.companyName : userData.fullName,
        receiverId: receiverId,
        receiverName: receiverName,
        content: newMessage,
        senderType: userType,
        receiverType: receiverType,
        conversationId: activeChat.conversationId, // Use existing conversationId
        fileType: selectedFile ? selectedFile.type : null,
        fileName: selectedFile ? selectedFile.name : null
      }

      // Send message to backend
      const result = await contactAPI.sendMessage(messageData, selectedFile)
      
      // After sending, fetch all messages to ensure we have the latest
      await fetchMessages(activeChat.conversationId);
      
      setNewMessage('')
      setSelectedFile(null)
      setPreviewUrl('')
      
      // Show success notification
      // alert('Message sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message: ' + (error.message || 'Unknown error occurred'))
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (limit to 10MB to match backend)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
      }
      
      setSelectedFile(file)
      
      // Create preview for images and PDFs
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target.result)
        }
        reader.onerror = (e) => {
          console.error('Error reading file:', e)
          setPreviewUrl('')
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files including PDFs, show a generic preview
        setPreviewUrl('')
      }
    }
  }

  const handleTyping = () => {
    setIsTyping(true)
    // In a real app, you would send typing indicator to the other user
    // For now, we'll just simulate the typing indicator
    setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const handleBackToDashboard = () => {
    if (userType === 'startup') {
      navigate('/startup/dashboard')
    } else {
      navigate('/investor/dashboard')
    }
  }

  const handleAgreementInitiated = (agreementId, agreementData) => {
    // Fetch the actual agreement data from the backend to ensure we have the latest data
    if (agreementId) {
      agreementAPI.getAgreement(agreementId)
        .then(fetchedAgreement => {
          setAgreementData(fetchedAgreement);
          // Store the agreementId in state
          setAgreementId(agreementId);
          setShowAgreement(true);
        })
        .catch(error => {
          console.error('Error fetching agreement:', error);
          // Fallback to the provided agreementData
          setAgreementData(agreementData);
          setAgreementId(agreementId);
          setShowAgreement(true);
        });
    } else {
      // Use the agreement data directly (it already contains all the details)
      if (activeChat) {
        setAgreementData(agreementData);
        // Store the agreementId in state
        setAgreementId(agreementId);
        setShowAgreement(true);
      }
    }
  };

  // Function to close agreement and refresh notifications
  const handleCloseAgreement = () => {
    setShowAgreement(false);
    setAgreementData(null);
    setAgreementId(null);
    // Refresh notifications to show updated agreement status
    fetchNotifications();
  };

  // Add handler for investment offer
  const handleSendInvestmentOffer = async (offerData) => {
    if (!activeChat) return;
    
    try {
      // Determine receiver based on user type
      let receiverId, receiverName, receiverType
      if (userType === 'startup') {
        // If current user is startup, receiver is the investor
        receiverId = activeChat.investorId
        receiverName = activeChat.investorName
        receiverType = 'investor'
      } else {
        // If current user is investor, receiver is the startup
        receiverId = activeChat.startupId
        receiverName = activeChat.startupName
        receiverType = 'startup'
      }

      // Format the investment offer message - Show only INR amount
      const offerMessage = `
📈 INVESTMENT OFFER

Investment Amount: ${offerData.investmentAmountInr}
Equity/Ownership Percentage: ${offerData.equityPercentage}%
${offerData.terms ? `Terms: ${offerData.terms}` : ''}
Please review this offer and let me know if you'd like to proceed.
      `.trim();

      const messageData = {
        senderId: userData._id,
        senderName: userType === 'startup' ? userData.companyName : userData.fullName,
        receiverId: receiverId,
        receiverName: receiverName,
        content: offerMessage,
        senderType: userType,
        receiverType: receiverType,
        conversationId: activeChat.conversationId,
      }

      // Send message to backend
      await contactAPI.sendMessage(messageData)
      
      // After sending, fetch all messages to ensure we have the latest
      await fetchMessages(activeChat.conversationId);
      
      // Close the investment offer form
      setShowInvestmentOffer(false);
      
      // Show success notification
      alert('Investment offer sent successfully!');
    } catch (error) {
      console.error('Error sending investment offer:', error)
      alert('Failed to send investment offer: ' + (error.message || 'Unknown error occurred'))
    }
  };

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>🔔 Notifications</h2>
        </div>
        <div className="nav-links">
          <button onClick={handleBackToDashboard} className="btn btn-secondary" style={{ marginRight: '15px' }}>
            ← Back to Dashboard
          </button>
          
          {/* Modern Profile Section */}
          <div className="profile-section">
            <div className="profile-avatar">
              {userType === 'startup' ? userData.companyName.charAt(0).toUpperCase() : userData.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">
                {userType === 'startup' ? userData.companyName : userData.fullName}
              </span>
              <span className="profile-type">
                {userType === 'startup' ? 'Startup' : 'Investor'}
              </span>
            </div>
            <div className="profile-dropdown-toggle">
              ▼
            </div>
            
            {/* Dropdown Menu */}
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">
                  {userType === 'startup' ? userData.companyName : userData.fullName}
                </div>
                <div className="profile-dropdown-email">
                  {userData.email}
                </div>
              </div>
              <button 
                onClick={handleBackToDashboard}
                className="profile-dropdown-item"
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => {
                  if (userType === 'startup') {
                    navigate('/startup/notifications');
                  } else {
                    navigate('/investor/notifications');
                  }
                }}
                className="profile-dropdown-item"
              >
                🔔 Notifications
              </button>
              <button 
                onClick={() => {
                  // Clear localStorage and navigate to login
                  localStorage.removeItem('token');
                  localStorage.removeItem('userType');
                  localStorage.removeItem('userData');
                  
                  if (userType === 'startup') {
                    navigate('/startup/login');
                  } else {
                    navigate('/investor/login');
                  }
                }}
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
          <h1>Notifications & Messages</h1>
          <p>Manage your communications and conversations</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
          {/* Notifications List */}
          <div style={{ 
            flex: '1', 
            background: 'white', 
            borderRadius: '15px', 
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h2 style={{ color: '#667eea', margin: 0 }}>🔔 Notifications</h2>
                          <button 
                            onClick={fetchNotifications}
                            className="btn btn-secondary"
                            style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                          >
                            🔄 Refresh
                          </button>
                        </div>
            
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div 
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      background: activeChat && activeChat._id === notification._id ? '#e3f2fd' : 
                                  notification.status === 'pending' ? '#fff8e1' : '#f5f5f5',
                      borderLeft: notification.status === 'pending' ? '4px solid #ff9800' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      // Highlight investment offers
                      ...(notification.message && notification.message.includes('INVESTMENT OFFER') ? {
                        borderLeft: '4px solid #28a745',
                        background: '#d4edda'
                      } : {})
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#667eea' }}>
                        {userType === 'startup' ? notification.investorName : notification.startupName}
                      </strong>
                      {notification.status === 'pending' && (
                        <span style={{
                          background: '#ff9800',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          fontSize: '0.7rem'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: '#666', 
                      margin: '8px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notification.message}
                    </p>
                    {/* Highlight investment offers in the notification list */}
                    {notification.message && notification.message.includes('INVESTMENT OFFER') && (
                      <div style={{
                        background: '#c3e6cb',
                        border: '1px solid #28a745',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: '#155724',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>📈</span>
                        <span>Investment Offer Received!</span>
                      </div>
                    )}
                    <small style={{ color: '#999' }}>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Box */}
          <div style={{ 
            flex: '2', 
            background: 'white', 
            borderRadius: '15px', 
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {activeChat ? (
              <>
                <div style={{ 
                  borderBottom: '1px solid #eee', 
                  paddingBottom: '15px', 
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{ color: '#667eea', margin: 0 }}>
                    💬 Chat with {userType === 'startup' ? activeChat.investorName : activeChat.startupName}
                  </h2>
                </div>
                
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  marginBottom: '15px',
                  maxHeight: '350px'
                }}>
                  {messages.map(msg => {
                    // Check if this is an investment offer message
                    const isInvestmentOffer = msg.message && msg.message.includes('INVESTMENT OFFER');
                    
                    return (
                      <div 
                        key={msg.id}
                        style={{
                          textAlign: msg.isOwn ? 'right' : 'left',
                          marginBottom: '15px'
                        }}
                      >
                        <div style={{
                          display: 'inline-block',
                          maxWidth: '70%',
                          padding: '10px 15px',
                          borderRadius: '18px',
                          background: msg.isOwn ? '#667eea' : (isInvestmentOffer ? '#d4edda' : '#f0f0f0'),
                          color: msg.isOwn ? 'white' : (isInvestmentOffer ? '#155724' : 'black'),
                          textAlign: 'left',
                          border: isInvestmentOffer ? '2px solid #28a745' : 'none'
                        }}>
                          <div style={{ fontSize: '0.8rem', marginBottom: '5px', opacity: 0.8 }}>
                            {msg.sender}
                          </div>
                          {isInvestmentOffer ? (
                            // Render investment offer with special formatting
                            <div>
                              <div style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 'bold', 
                                marginBottom: '10px',
                                textAlign: 'center'
                              }}>
                                📈 INVESTMENT OFFER
                              </div>
                              {msg.message.split('\n').map((line, index) => {
                                if (line.trim() === '' || line.includes('INVESTMENT OFFER')) return null;
                                
                                // Format key-value pairs
                                if (line.includes(':')) {
                                  const [key, value] = line.split(':');
                                  return (
                                    <div key={index} style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      marginBottom: '5px',
                                      padding: '5px 0',
                                      borderBottom: '1px dashed rgba(0,0,0,0.1)'
                                    }}>
                                      <strong>{key.trim()}:</strong>
                                      <span>{value.trim()}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={index} style={{ marginBottom: '5px' }}>
                                    {line}
                                  </div>
                                );
                              })}
                            </div>
                          ) : msg.file && msg.fileType && msg.fileType.startsWith('image/') ? (
                            <div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                marginBottom: '8px',
                                padding: '8px 12px',
                                background: '#f0f8ff',
                                borderRadius: '8px',
                                border: '1px solid #d0e8ff'
                              }}>
                                <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Image Attachment</div>
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{msg.fileName || 'Image'}</div>
                                </div>
                              </div>
                              <img 
                                src={msg.file} 
                                alt="Shared file" 
                                style={{ 
                                  maxWidth: '200px', 
                                  maxHeight: '200px', 
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                                onError={(e) => {
                                  const fallbackDiv = document.createElement('div');
                                  fallbackDiv.innerHTML = `
                                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0f8ff; border-radius: 8px; border: 1px solid #d0e8ff;">
                                      <span style="font-size: 1.2rem;">📎</span>
                                      <div>
                                        <div style="font-weight: 600; font-size: 0.9rem;">Image Attachment</div>
                                        <div style="font-size: 0.8rem; color: #666;">${msg.fileName || 'Image'}</div>
                                      </div>
                                    </div>
                                  `;
                                  e.target.parentNode.replaceChild(fallbackDiv, e.target);
                                }}
                              />
                              {msg.message && <div style={{ marginTop: '8px' }}>{msg.message}</div>}
                            </div>
                          ) : msg.file ? (
                            <div>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                marginBottom: '8px',
                                padding: '8px 12px',
                                background: '#f0f8ff',
                                borderRadius: '8px',
                                border: '1px solid #d0e8ff'
                              }}>
                                <span style={{ fontSize: '1.2rem' }}>
                                  {msg.fileType === 'application/pdf' ? '📄' : 
                                   msg.fileType.includes('word') ? '📝' : 
                                   msg.fileType.includes('excel') || msg.fileType.includes('spreadsheet') ? '📊' : 
                                   msg.fileType.includes('powerpoint') || msg.fileType.includes('presentation') ? '📽️' : 
                                   msg.fileType.includes('zip') ? '📁' : '📎'}
                                </span>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    {msg.fileType === 'application/pdf' ? 'PDF Document' : 
                                     msg.fileType.includes('word') ? 'Word Document' : 
                                     msg.fileType.includes('excel') || msg.fileType.includes('spreadsheet') ? 'Excel Spreadsheet' : 
                                     msg.fileType.includes('powerpoint') || msg.fileType.includes('presentation') ? 'PowerPoint Presentation' : 
                                     msg.fileType.includes('zip') ? 'ZIP Archive' : 'File Attachment'}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{msg.fileName || 'Document'}</div>
                                </div>
                                <a 
                                  href={msg.file} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    marginLeft: 'auto',
                                    padding: '4px 8px',
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#5a6fd8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#667eea';
                                  }}
                                >
                                  Download
                                </a>
                              </div>
                              {msg.message && <div style={{ marginTop: '8px' }}>{msg.message}</div>}
                            </div>
                          ) : (
                            <div>{msg.message}</div>
                          )}
                          <div style={{ 
                            fontSize: '0.7rem', 
                            marginTop: '5px', 
                            opacity: 0.7,
                            textAlign: msg.isOwn ? 'right' : 'left'
                          }}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div style={{
                      textAlign: 'left',
                      marginBottom: '15px'
                    }}>
                      <div className="typing-indicator">
                        <div className="sender">
                          {userType === 'startup' ? activeChat.investorName : activeChat.startupName}
                        </div>
                        <div className="dots">...</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '10px',
                  borderTop: '1px solid #eee',
                  paddingTop: '15px',
                  flexDirection: 'column'
                }}>
                  {/* Agreement Button - Only show when chat is active and agreement is not yet created */}
                  {activeChat && !showAgreement && (
                    <AgreementButton 
                      userType={userType}
                      activeChat={{
                        ...activeChat,
                        startupEmail: activeChat.startupEmail,
                        investorEmail: activeChat.investorEmail
                      }}
                      onAgreementInitiated={handleAgreementInitiated}
                      messages={messages}
                      ideaId={activeChat.projectTitle || activeChat.businessIdea} // Pass idea_id based on project title or business idea
                    />
                  )}
                  
                  {/* Investment Offer Button - Only show for investors */}
                  {activeChat && userType === 'investor' && !showAgreement && (
                    <button
                      onClick={() => setShowInvestmentOffer(true)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#28a745',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#218838';
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#28a745';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      📈 Send Investment Offer
                    </button>
                  )}
                                    
                  {/* Agreement Page - Show when agreement is created */}
                  {showAgreement && agreementData && (
                    <div style={{ 
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      zIndex: 1000,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        maxWidth: '90%',
                        maxHeight: '90%',
                        overflow: 'auto'
                      }}>
                        {/* Debug logging */}
                        {agreementData && console.log('Notifications agreementData:', agreementData)}
                        
                        {/* PDF Download Button - Only show when both parties have signed */}
                        {agreementData && agreementData.signatures && (() => {
                          // More robust check for both parties signed
                          const startupSignature = agreementData.signatures.find(sig => sig.userType === 'startup' && sig.signature);
                          const investorSignature = agreementData.signatures.find(sig => sig.userType === 'investor' && sig.signature);
                          const bothPartiesSigned = !!(startupSignature && investorSignature);
                          
                          console.log('Notifications signature check:', {
                            signatures: agreementData.signatures,
                            startupSignature: !!startupSignature,
                            investorSignature: !!investorSignature,
                            bothPartiesSigned
                          });
                          
                          return bothPartiesSigned;
                        })() && (
                          <button
                            onClick={generateAgreementPDF}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '60px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            📄 Download PDF
                          </button>
                        )}
                        <AgreementPage 
                          agreementData={agreementData}
                          userType={userType}
                          agreementId={agreementId}
                          ideaId={"uhub"} // Force ideaId to 'uhub' for the specific case
                        />
                        <button
                          onClick={handleCloseAgreement}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ff4757',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Investment Offer Form - Show when investment offer is being created */}
                  {showInvestmentOffer && (
                    <InvestmentOfferForm
                      onSendOffer={handleSendInvestmentOffer}
                      onCancel={() => setShowInvestmentOffer(false)}
                    />
                  )}
                                    
                  {previewUrl && (
                    <div style={{ 
                      position: 'relative', 
                      display: 'inline-block',
                      marginBottom: '10px'
                    }}>
                      {selectedFile.type.startsWith('image/') ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: '100px', 
                            maxHeight: '100px', 
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '8px 12px',
                          background: '#f0f8ff',
                          borderRadius: '8px',
                          border: '1px solid #d0e8ff'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>
                            {selectedFile.type === 'application/pdf' ? '📄' : 
                             selectedFile.type.includes('word') ? '📝' : 
                             selectedFile.type.includes('excel') || selectedFile.type.includes('spreadsheet') ? '📊' : 
                             selectedFile.type.includes('powerpoint') || selectedFile.type.includes('presentation') ? '📽️' : 
                             selectedFile.type.includes('zip') ? '📁' : '📎'}
                          </span>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                              {selectedFile.type === 'application/pdf' ? 'PDF Document' : 
                               selectedFile.type.includes('word') ? 'Word Document' : 
                               selectedFile.type.includes('excel') || selectedFile.type.includes('spreadsheet') ? 'Excel Spreadsheet' : 
                               selectedFile.type.includes('powerpoint') || selectedFile.type.includes('presentation') ? 'PowerPoint Presentation' : 
                               selectedFile.type.includes('zip') ? 'ZIP Archive' : 'File'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{selectedFile.name}</div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl('')
                        }}
                        className="file-preview-remove"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff4757',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="fileInput"
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    />
                    <label 
                      htmlFor="fileInput"
                      className="btn btn-secondary"
                      style={{
                        padding: '12px 15px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '48px',
                        minHeight: '48px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e0e0e0';
                        e.target.style.borderColor = '#ccc';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f0f0f0';
                        e.target.style.borderColor = '#ddd';
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📎</span>
                    </label>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      placeholder="Type your message..."
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '24px',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '1rem',
                        backgroundColor: '#f8f8f8',
                        transition: 'all 0.2s'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage()
                        }
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#667eea';
                        e.target.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8f8f8';
                        e.target.style.borderColor = '#ddd';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="btn btn-primary"
                      style={{
                        padding: '12px 20px',
                        borderRadius: '24px',
                        minWidth: '48px',
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#667eea',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#5a6fd8';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#667eea';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>➤</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                color: '#999'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</div>
                  <h3>Select a notification to start chatting</h3>
                  <p>Choose a conversation from the list to begin messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications