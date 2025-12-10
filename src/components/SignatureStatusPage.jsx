import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementAPI } from '../api/api';
import { jsPDF } from "jspdf";

const SignatureStatusPage = ({ userType }) => {
  const navigate = useNavigate();
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get agreement ID from localStorage
  const agreementId = localStorage.getItem('currentAgreementId');

  useEffect(() => {
    const fetchAgreementStatus = async () => {
      if (!agreementId) {
        setError('No agreement found');
        setLoading(false);
        return;
      }

      try {
        const data = await agreementAPI.getAgreement(agreementId);
        setAgreementData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch agreement status');
        setLoading(false);
      }
    };

    fetchAgreementStatus();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchAgreementStatus, 3000);
    return () => clearInterval(interval);
  }, [agreementId]);

  // Check if startup has signed (simplified detection)
  const hasStartupSigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check by user type - this is the most reliable method
    return agreementData.signatures.some(sig => sig.userType === 'startup');
  };

  // Check if investor has signed (simplified detection)
  const hasInvestorSigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check by user type - this is the most reliable method
    return agreementData.signatures.some(sig => sig.userType === 'investor');
  };

  // Check if both parties have signed (improved detection)
  const hasBothPartiesSigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check both parties by user type with strict validation
    const startupSigned = agreementData.signatures.some(sig => 
      sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
    );
    const investorSigned = agreementData.signatures.some(sig => 
      sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
    );
    
    return startupSigned && investorSigned;
  };

  // Generate detailed agreement PDF
  const generateDetailedAgreementPDF = () => {
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
    const startupSignature = agreementData?.signatures?.find(sig => 
      sig.userType === 'startup' && sig.signature && sig.signature.trim().length > 0
    );
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
    const investorSignature = agreementData?.signatures?.find(sig => 
      sig.userType === 'investor' && sig.signature && sig.signature.trim().length > 0
    );
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
    doc.save(`final-investment-agreement-${agreementData?.startupName || 'startup'}-${agreementData?.investorName || 'investor'}.pdf`);
  };

  // Redirect when both parties have signed
  useEffect(() => {
    if (agreementData) {
      console.log('Agreement data updated:', agreementData);
      console.log('Has both parties signed:', hasBothPartiesSigned());
      
      if (hasBothPartiesSigned()) {
        // Both parties have signed, generate PDF and redirect to final page
        console.log('Both parties signed, generating PDF and redirecting to final page');
        
        // Store the finalized agreement data in localStorage for the final page
        localStorage.setItem('finalizedAgreement', JSON.stringify(agreementData));
        localStorage.setItem('agreementUserType', userType);
        
        // Generate and download PDF automatically
        try {
          generateDetailedAgreementPDF();
          console.log('PDF generated and downloaded successfully');
        } catch (error) {
          console.error('Error generating PDF:', error);
        }
        
        // Show notification
        alert('Both parties have signed the agreement! The PDF has been downloaded. Redirecting to the final page...');
        
        // Redirect to the final agreement page
        setTimeout(() => {
          if (userType === 'startup') {
            window.location.href = '/startup/final-agreement';
          } else {
            window.location.href = '/investor/final-agreement';
          }
        }, 1000);
      }
    }
  }, [agreementData, userType]);

  if (loading) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '30px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2>Loading Agreement Status...</h2>
        <div className="spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '30px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#dc3545' }}>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // If both parties have signed, don't show the status page, just redirect
  if (hasBothPartiesSigned()) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '30px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2>🎉 Agreement Finalized!</h2>
        <p>Both parties have signed. Redirecting to final submission page...</p>
      </div>
    );
  }

  // Show status page only when both haven't signed
  const startupHasSigned = hasStartupSigned();
  const investorHasSigned = hasInvestorSigned();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '50px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ 
        color: '#667eea', 
        textAlign: 'center', 
        marginBottom: '30px' 
      }}>
        Agreement Processing
      </h1>
      
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#856404' }}>📋 Agreement Status</h2>
        <p style={{ fontSize: '1.1rem' }}>
          Your investment agreement is being processed.
        </p>
        <p style={{ fontSize: '1rem', marginTop: '15px', color: '#666' }}>
          <strong>Startup has signed the agreement!</strong> Please review the terms and sign to complete the investment process.
        </p>
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: '#d4edda', 
          borderRadius: '6px',
          border: '1px solid #c3e6cb'
        }}>
          <p style={{ margin: '0', color: '#155724' }}>
            ✅ <strong>Next Steps:</strong> Review the agreement terms carefully, then click "Agree & Sign Agreement" to finalize the investment.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        {/* Agree Button - Navigates to Agreement Signing Page */}
        <button 
          onClick={() => {
            // Navigate to the agreement page
            if (userType === 'startup') {
              navigate('/agreement');
            } else {
              navigate('/agreement');
            }
          }}
          style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          ✍️ Agree & Sign Agreement
        </button>
        
        <button 
          onClick={() => {
            if (userType === 'startup') {
              navigate('/startup/dashboard');
            } else {
              navigate('/investor/dashboard');
            }
          }}
          style={{
            padding: '10px 20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SignatureStatusPage;