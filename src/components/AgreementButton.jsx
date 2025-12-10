import React, { useState, useEffect } from 'react';
import { agreementAPI } from '../api/api';
import { jsPDF } from "jspdf";

const AgreementButton = ({ userType, activeChat, onAgreementInitiated, messages, ideaId }) => {
  const [bothAgreed, setBothAgreed] = useState(false);
  const [agreementStatus, setAgreementStatus] = useState('pending'); // pending, agreed, created, finalized
  const [agreementId, setAgreementId] = useState(null);
  const [agreementData, setAgreementData] = useState(null);

  // Fetch agreement data periodically to update signature status
  useEffect(() => {
    let intervalId;
    
    if (agreementId) {
      // Fetch agreement data immediately
      const fetchAgreementData = async () => {
        try {
          const updatedAgreement = await agreementAPI.getAgreement(agreementId);
          console.log('AgreementButton - Fetched updated agreement data:', updatedAgreement);
          setAgreementData(updatedAgreement);
          
          // Check if both parties have signed (must check for actual signature images)
          const hasStartupSignature = updatedAgreement.signatures?.some(sig => sig.userType === 'startup' && sig.signature);
          const hasInvestorSignature = updatedAgreement.signatures?.some(sig => sig.userType === 'investor' && sig.signature);
          const isFinalized = updatedAgreement.status === 'finalized' || (hasStartupSignature && hasInvestorSignature);
          
          console.log('AgreementButton status check:', {
            status: updatedAgreement.status,
            hasStartupSignature,
            hasInvestorSignature,
            isFinalized,
            signatures: updatedAgreement.signatures
          });
          
          // Update agreement status if needed
          if (isFinalized) {
            setAgreementStatus('finalized');
          } else if (updatedAgreement.signatures && updatedAgreement.signatures.some(sig => sig.signature)) {
            setAgreementStatus('signed');
          }
        } catch (error) {
          console.error('Error fetching agreement:', error);
        }
      };
      
      fetchAgreementData();
      
      // Set up polling for agreement updates
      intervalId = setInterval(fetchAgreementData, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [agreementId]);

  // Check if both parties have signed
  const bothPartiesSigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check if both parties have signed by looking at the signatures array
    // Must check that signature image exists, not just that the signature object exists
    const startupSigned = agreementData.signatures.some(sig => sig.userType === 'startup' && sig.signature);
    const investorSigned = agreementData.signatures.some(sig => sig.userType === 'investor' && sig.signature);
    
    console.log('AgreementButton bothPartiesSigned check:', {
      signatures: agreementData.signatures,
      startupSigned,
      investorSigned,
      bothSigned: startupSigned && investorSigned
    });
    
    return startupSigned && investorSigned;
  };

  // Check if both parties have agreed to create an agreement
  const handleBothAgree = async () => {
    if (bothAgreed) return;
    
    setBothAgreed(true);
    
    try {
      // Generate a conversation ID for new agreements
      const conversationId = activeChat?.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if this is from an investment offer by looking at the last message
      let investmentAmount = '$100,000';
      let equityStake = '10%';
      let valuationCap = '$1,000,000';
      
      // If we have messages, check if the last one is an investment offer
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.message && lastMessage.message.includes('INVESTMENT OFFER')) {
          // Parse the investment offer to extract amount and equity percentage
          const messageLines = lastMessage.message.split('\n');
          for (const line of messageLines) {
            if (line.startsWith('Investment Amount:')) {
              // Extract the INR amount from the investment offer
              const amountMatch = line.match(/Investment Amount:\s*(.*)/);
              if (amountMatch && amountMatch[1]) {
                investmentAmount = amountMatch[1].trim();
              }
            } else if (line.startsWith('Equity/Ownership Percentage:')) {
              const equityMatch = line.match(/Equity\/Ownership Percentage:\s*([0-9.]+)%/);
              if (equityMatch && equityMatch[1]) {
                equityStake = `${equityMatch[1].trim()}%`;
              }
            }
          }
        }
      }
      
      // Ensure investment amount is properly formatted
      if (investmentAmount && typeof investmentAmount === 'string' && investmentAmount.includes('₹')) {
        // Already in INR format, keep as is
      } else if (investmentAmount && typeof investmentAmount === 'string' && investmentAmount.includes('$')) {
        // Convert USD to INR format
        const usdAmount = parseFloat(investmentAmount.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(usdAmount)) {
          const USD_TO_INR_RATE = 83;
          const inrAmount = usdAmount * USD_TO_INR_RATE;
          
          // Format in lakhs or crores
          if (inrAmount >= 10000000) { // 1 crore or more
            investmentAmount = `₹${(inrAmount / 10000000).toFixed(2)} Crore`;
          } else if (inrAmount >= 100000) { // 1 lakh or more
            investmentAmount = `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
          } else {
            investmentAmount = `₹${inrAmount.toLocaleString('en-IN')}`;
          }
        }
      } else if (investmentAmount && !isNaN(parseFloat(investmentAmount))) {
        // Raw numeric value, convert to INR format
        const usdAmount = parseFloat(investmentAmount);
        const USD_TO_INR_RATE = 83;
        const inrAmount = usdAmount * USD_TO_INR_RATE;
        
        // Format in lakhs or crores
        if (inrAmount >= 10000000) { // 1 crore or more
          investmentAmount = `₹${(inrAmount / 10000000).toFixed(2)} Crore`;
        } else if (inrAmount >= 100000) { // 1 lakh or more
          investmentAmount = `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
        } else {
          investmentAmount = `₹${inrAmount.toLocaleString('en-IN')}`;
        }
      }
      
      // Create agreement with dynamic investment data
      const agreementData = {
        startupId: activeChat.startupId,
        startupName: activeChat.startupName,
        businessIdea: activeChat.projectTitle || activeChat.businessIdea || 'Innovative technology solution',
        startupDescription: activeChat.startupDescription || 'A revolutionary platform solving critical industry problems',
        investorId: activeChat.investorId,
        investorName: activeChat.investorName,
        investorType: activeChat.investorType || 'Venture Capital',
        investmentRange: activeChat.investmentRange || '$100K - $1M',
        conversationId: conversationId,
        investmentAmount: investmentAmount,  // Use parsed amount from investment offer
        equityStake: equityStake,           // Use parsed equity from investment offer
        valuationCap: valuationCap,
        status: 'draft',
        // Add email information for fetching registration details
        startupEmail: activeChat.startupEmail,
        investorEmail: activeChat.investorEmail
      };
      
      const result = await agreementAPI.createAgreement(agreementData);
      setAgreementId(result._id);
      console.log('Agreement created with ID:', result._id);
      
      // Fetch the actual agreement data from the backend to ensure we have the correct structure
      const updatedAgreement = await agreementAPI.getAgreement(result._id);
      setAgreementData(updatedAgreement);
      
      // Automatically show the agreement creation button
      setAgreementStatus('proposed');
    } catch (error) {
      console.error('Error creating agreement:', error);
      alert('Failed to create agreement: ' + error.message);
    }
  };

  // Create the agreement directly
  const handleCreateAgreement = async () => {
    setAgreementStatus('created');
    
    // Update agreement status to 'created' in the backend
    try {
      if (agreementId) {
        await agreementAPI.updateAgreement(agreementId, { status: 'created' });
        console.log('Agreement status updated to created');
        
        // Immediately fetch updated agreement data to ensure UI is in sync
        const updatedAgreement = await agreementAPI.getAgreement(agreementId);
        setAgreementData(updatedAgreement);
      }
      
      // Notify parent component that agreement should be created
      onAgreementInitiated(agreementId, agreementData, ideaId);
      console.log('Agreement created');
    } catch (error) {
      console.error('Error updating agreement:', error);
      alert('Failed to update agreement: ' + error.message);
    }
  };

  // Add PDF generation function
  const generatePDF = () => {
    if (!agreementData) return;
    
    const doc = new jsPDF();
    
    // Format the current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Add title
    doc.setFontSize(22);
    doc.text('Investment Agreement', 105, 20, null, null, 'center');
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 105, 30, null, null, 'center');
    
    // Add agreement ID and status
    doc.setFontSize(10);
    doc.text(`Agreement ID: ${agreementData?._id || 'N/A'}`, 105, 35, null, null, 'center');
    doc.text(`Status: Finalized`, 105, 40, null, null, 'center');
    
    // Add startup details section
    doc.setFontSize(16);
    doc.text('Startup Details', 20, 50);
    
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);
    
    doc.setFontSize(12);
    doc.text(`Company Name: ${agreementData?.startupName || 'N/A'}`, 20, 62);
    doc.text(`Business Idea: ${agreementData?.businessIdea || 'Tech Innovation Platform'}`, 20, 72);
    doc.text(`Description: ${agreementData?.startupDescription || 'A revolutionary platform solving critical industry problems'}`, 20, 82);
    doc.text(`Investment Amount: ${agreementData?.investmentAmount || '$100,000'}`, 20, 92);
    doc.text(`Equity Stake: ${agreementData?.equityStake || '10%'}`, 20, 102);
    
    // Add investor details section
    doc.setFontSize(16);
    doc.text('Investor Details', 20, 117);
    
    doc.setLineWidth(0.5);
    doc.line(20, 119, 190, 119);
    
    doc.setFontSize(12);
    doc.text(`Investor Name: ${agreementData?.investorName || 'N/A'}`, 20, 129);
    doc.text(`Investor Type: ${agreementData?.investorType || 'Venture Capital'}`, 20, 139);
    doc.text(`Investment Range: ${agreementData?.investmentRange || '$100K - $1M'}`, 20, 149);
    doc.text(`Investment Amount: ${agreementData?.investmentAmount || '$100,000'}`, 20, 159);
    doc.text(`Ownership Percentage: ${agreementData?.equityStake || '10%'}`, 20, 169);
    doc.text(`Valuation Cap: ${agreementData?.valuationCap || '$1,000,000'}`, 20, 179);
    
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
    doc.text(`Name: ${agreementData?.startupName || 'N/A'}`, 20, 50);
    doc.text(`Date: ${currentDate}`, 20, 60);
    doc.text('Signature:', 20, 70);
    
    // Add startup signature if available
    const startupSignature = agreementData?.signatures?.find(sig => sig.userType === 'startup');
    if (startupSignature && startupSignature.signature) {
      doc.addImage(startupSignature.signature, 'PNG', 20, 75, 60, 20);
    } else {
      doc.setLineWidth(0.5);
      doc.line(20, 80, 100, 80); // Signature line
    }
    
    // Add startup signature details
    if (startupSignature) {
      doc.setFontSize(10);
      doc.text(`Signed by: ${startupSignature.userName}`, 20, 100);
      doc.text(`Signed on: ${new Date(startupSignature.timestamp).toLocaleString()}`, 20, 105);
      doc.text(`User ID: ${startupSignature.userId}`, 20, 110);
    }
    
    // Investor Signature
    doc.setFontSize(14);
    doc.text('Investor Representative:', 20, 130);
    doc.setFontSize(12);
    doc.text(`Name: ${agreementData?.investorName || 'N/A'}`, 20, 140);
    doc.text(`Date: ${currentDate}`, 20, 150);
    doc.text('Signature:', 20, 160);
    
    // Add investor signature if available
    const investorSignature = agreementData?.signatures?.find(sig => sig.userType === 'investor');
    if (investorSignature && investorSignature.signature) {
      doc.addImage(investorSignature.signature, 'PNG', 20, 165, 60, 20);
    } else {
      doc.setLineWidth(0.5);
      doc.line(20, 170, 100, 170); // Signature line
    }
    
    // Add investor signature details
    if (investorSignature) {
      doc.setFontSize(10);
      doc.text(`Signed by: ${investorSignature.userName}`, 20, 190);
      doc.text(`Signed on: ${new Date(investorSignature.timestamp).toLocaleString()}`, 20, 195);
      doc.text(`User ID: ${investorSignature.userId}`, 20, 200);
    }
    
    // Add agreement terms confirmation
    doc.setFontSize(12);
    doc.text('Both parties acknowledge and agree to the terms outlined in this agreement.', 20, 220);
    doc.text('This document is legally binding upon the signatures of both parties.', 20, 230);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('This document represents a legally binding agreement between the parties.', 105, 280, null, null, 'center');
    doc.text(`Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()}`, 105, 285, null, null, 'center');
    
    // Save the PDF
    doc.save(`investment-agreement-${agreementData?.startupName || 'startup'}-${agreementData?.investorName || 'investor'}.pdf`);
  };

  return (
    <div style={{ 
      marginTop: '15px', 
      padding: '15px', 
      background: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <h4 style={{ color: '#667eea', margin: '0 0 15px 0' }}>🤝 Investment Agreement</h4>
      
      {/* Debug logging */}
      {agreementData && console.log('AgreementButton agreementData:', agreementData)}
      
      {/* Check if both parties have signed the agreement */}
      {bothPartiesSigned() ? (
        // Show Download PDF button only when both parties have signed
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={generatePDF}
            className="btn btn-primary"
            style={{
              padding: '10px 15px',
              borderRadius: '6px',
              border: 'none',
              background: '#28a745',
              color: 'white',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '10px'
            }}
          >
            📄 Download PDF
          </button>
        </div>
      ) : agreementData && agreementData.signatures && agreementData.signatures.some(sig => sig.userType === userType && sig.signature) ? (
        // Show a neutral message when current user has signed but other party hasn't
        <div style={{ 
          marginBottom: '15px',
          padding: '10px 15px',
          borderRadius: '6px',
          background: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb',
          textAlign: 'center'
        }}>
          Agreement sent to the other party for signature
        </div>
      ) : (
        <>
          {/* Step 1: Both Agree */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              background: '#e9ecef', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#667eea' }}>🤝 Agreement Process</h4>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>
                Both parties must explicitly agree to the terms before proceeding
              </p>
            </div>
            
            <button 
              onClick={handleBothAgree}
              disabled={bothAgreed}
              className="btn btn-secondary"
              style={{
                padding: '12px 15px',
                borderRadius: '6px',
                border: 'none',
                background: bothAgreed ? '#28a745' : '#667eea',
                color: 'white',
                cursor: bothAgreed ? 'not-allowed' : 'pointer',
                width: '100%',
                marginBottom: '10px',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              {bothAgreed ? '✅ Both Parties Agreed to Terms' : '👍 I Agree to the Investment Terms'}
            </button>
            
            {bothAgreed && (
              <div style={{ 
                padding: '10px', 
                background: '#d4edda', 
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                <p style={{ margin: '0', color: '#155724' }}>
                  ✅ Both parties have agreed to the investment terms. You can now proceed to create the formal agreement.
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Create Agreement Button (shown automatically after both agree) */}
          {bothAgreed && (
            <div style={{ marginBottom: '15px' }}>
              <button 
                onClick={handleCreateAgreement}
                className="btn btn-primary"
                style={{
                  padding: '12px 15px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#28a745',
                  color: 'white',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                📝 Create Formal Investment Agreement
              </button>
            </div>
          )}
        </>
      )}

      {/* Agreement Status Indicator */}
      <div style={{ 
        fontSize: '0.9rem', 
        color: '#666',
        padding: '10px',
        background: '#e9ecef',
        borderRadius: '4px',
        marginTop: '10px'
      }}>
        <strong>Status:</strong> {agreementStatus.charAt(0).toUpperCase() + agreementStatus.slice(1)}
        {agreementId && <div><strong>ID:</strong> {agreementId.substring(0, 8)}...</div>}
      </div>
    </div>
  );
};

export default AgreementButton;