import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";

const FinalAgreementPage = ({ agreementData, userType }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementDataState, setAgreementDataState] = useState(agreementData);
  
  // Load agreement data from localStorage if not provided
  useEffect(() => {
    if (!agreementDataState) {
      const storedAgreement = localStorage.getItem('finalizedAgreement');
      if (storedAgreement) {
        try {
          const parsed = JSON.parse(storedAgreement);
          setAgreementDataState(parsed);
          // Automatically generate and download PDF when page loads
          setTimeout(() => {
            generateDetailedAgreementPDF(parsed);
          }, 500);
        } catch (error) {
          console.error('Error parsing finalized agreement:', error);
        }
      }
    } else {
      // Automatically generate and download PDF when page loads with agreement data
      setTimeout(() => {
        generateDetailedAgreementPDF(agreementDataState);
      }, 500);
    }
  }, []);

  // Format the current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const generateDetailedAgreementPDF = (agreement = agreementDataState) => {
    if (!agreement) {
      console.error('No agreement data available for PDF generation');
      return;
    }
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.text('Investment Agreement', 105, 20, null, null, 'center');
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 105, 30, null, null, 'center');
    
    // Add agreement ID and status
    doc.setFontSize(10);
    doc.text(`Agreement ID: ${agreement?._id || 'N/A'}`, 105, 35, null, null, 'center');
    doc.text(`Status: Finalized`, 105, 40, null, null, 'center');
    
    // Add startup details section
    doc.setFontSize(16);
    doc.text('Startup Details', 20, 50);
    
    doc.setLineWidth(0.5);
    doc.line(20, 52, 190, 52);
    
    doc.setFontSize(12);
    doc.text(`Company Name: ${agreement?.startupName || 'N/A'}`, 20, 62);
    doc.text(`Business Idea: ${agreement?.businessIdea || 'Tech Innovation Platform'}`, 20, 72);
    doc.text(`Description: ${agreement?.startupDescription || 'A revolutionary platform solving critical industry problems'}`, 20, 82);
    doc.text(`Investment Amount: ${agreement?.investmentAmount || '$100,000'}`, 20, 92);
    doc.text(`Equity Stake: ${agreement?.equityStake || '10%'}`, 20, 102);
    
    // Add investor details section
    doc.setFontSize(16);
    doc.text('Investor Details', 20, 117);
    
    doc.setLineWidth(0.5);
    doc.line(20, 119, 190, 119);
    
    doc.setFontSize(12);
    doc.text(`Investor Name: ${agreement?.investorName || 'N/A'}`, 20, 129);
    doc.text(`Investor Type: ${agreement?.investorType || 'Venture Capital'}`, 20, 139);
    doc.text(`Investment Range: ${agreement?.investmentRange || '$100K - $1M'}`, 20, 149);
    doc.text(`Investment Amount: ${agreement?.investmentAmount || '$100,000'}`, 20, 159);
    doc.text(`Ownership Percentage: ${agreement?.equityStake || '10%'}`, 20, 169);
    doc.text(`Valuation Cap: ${agreement?.valuationCap || '$1,000,000'}`, 20, 179);
    
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
    const startupSignature = agreement?.signatures?.find(sig => sig.userType === 'startup' && sig.signature);
    if (startupSignature && startupSignature.signature) {
      try {
        doc.addImage(startupSignature.signature, 'PNG', 20, 75, 80, 30);
        doc.setFontSize(10);
        doc.text(`Signed by: ${startupSignature.userName || agreement?.startupName || 'N/A'}`, 20, 110);
        doc.text(`Signed on: ${startupSignature.timestamp ? new Date(startupSignature.timestamp).toLocaleString() : currentDate}`, 20, 115);
        doc.setFontSize(9);
        doc.text(`Status: ✓ Signed`, 20, 120);
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
    doc.text('Investor Representative:', 20, 140);
    doc.setFontSize(12);
    doc.text(`Name: ${agreement?.investorName || 'N/A'}`, 20, 150);
    doc.text(`Date: ${currentDate}`, 20, 160);
    doc.text('Signature:', 20, 170);
    
    // Add investor signature if available
    const investorSignature = agreement?.signatures?.find(sig => sig.userType === 'investor' && sig.signature);
    if (investorSignature && investorSignature.signature) {
      try {
        doc.addImage(investorSignature.signature, 'PNG', 20, 175, 80, 30);
        doc.setFontSize(10);
        doc.text(`Signed by: ${investorSignature.userName || agreement?.investorName || 'N/A'}`, 20, 210);
        doc.text(`Signed on: ${investorSignature.timestamp ? new Date(investorSignature.timestamp).toLocaleString() : currentDate}`, 20, 215);
        doc.setFontSize(9);
        doc.text(`Status: ✓ Signed`, 20, 220);
      } catch (error) {
        console.error('Error adding investor signature to PDF:', error);
        doc.setFontSize(10);
        doc.text('Error loading signature', 20, 185);
      }
    } else {
      doc.setFontSize(10);
      doc.text('Pending signature', 20, 185);
      doc.setLineWidth(0.5);
      doc.line(20, 190, 100, 190); // Signature line
    }
    
    // Add agreement terms confirmation
    doc.setFontSize(12);
    doc.text('Both parties acknowledge and agree to the terms outlined in this agreement.', 20, 220);
    doc.text('This document is legally binding upon the signatures of both parties.', 20, 230);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('This document represents a legally binding agreement between the parties.', 105, 280, null, null, 'center');
    doc.text(`Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()}`, 105, 285, null, null, 'center');
    
    // Add status information
    doc.setFontSize(12);
    const bothSigned = startupSignature && investorSignature;
    if (bothSigned) {
      doc.setTextColor(0, 128, 0); // Green color
      doc.text('✓ AGREEMENT FULLY EXECUTED - Both parties have signed', 105, 240, null, null, 'center');
      doc.setTextColor(0, 0, 0); // Reset to black
    }
    
    // Save the PDF
    doc.save(`final-investment-agreement-${agreement?.startupName || 'startup'}-${agreement?.investorName || 'investor'}.pdf`);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Generate and download the final PDF with both signatures
      const agreement = agreementDataState || JSON.parse(localStorage.getItem('finalizedAgreement') || '{}');
      generateDetailedAgreementPDF(agreement);
      
      // Show success message
      alert('Agreement finalized successfully! The PDF with both signatures has been downloaded.');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        if (userType === 'startup') {
          navigate('/startup/dashboard');
        } else {
          navigate('/investor/dashboard');
        }
      }, 1500);
    } catch (error) {
      console.error('Error finalizing agreement:', error);
      alert('Failed to finalize agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#667eea', textAlign: 'center', marginBottom: '30px' }}>Final Investment Agreement</h1>
      
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '15px',
        background: '#d4edda',
        borderRadius: '8px',
        border: '1px solid #c3e6cb'
      }}>
        <h2 style={{ 
          color: '#155724', 
          margin: '0 0 10px 0',
          fontSize: '1.5rem'
        }}>
          ✅ Agreement Finalized Successfully!
        </h2>
        <p style={{ fontSize: '1.1rem', margin: '10px 0' }}>
          Both parties have signed the agreement. You can now download the final document.
        </p>
      </div>
      
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          color: '#667eea', 
          marginTop: 0, 
          marginBottom: '20px', 
          textAlign: 'center',
          fontSize: '1.3rem'
        }}>
          📋 Agreement Details
        </h3>
        
        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Startup Details */}
          <div style={{ flex: '1' }}>
            <h4 style={{ color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              🚀 Startup Information
            </h4>
            <p><strong>Company Name:</strong> {agreementDataState?.startupName || 'N/A'}</p>
            <p><strong>Business Idea:</strong> {agreementDataState?.businessIdea || 'Tech Innovation Platform'}</p>
            <p><strong>Investment Amount:</strong> {agreementDataState?.investmentAmount || '$100,000'}</p>
            <p><strong>Equity Stake:</strong> {agreementDataState?.equityStake || '10%'}</p>
          </div>
          
          {/* Investor Details */}
          <div style={{ flex: '1' }}>
            <h4 style={{ color: '#667eea', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              💼 Investor Information
            </h4>
            <p><strong>Investor Name:</strong> {agreementDataState?.investorName || 'N/A'}</p>
            <p><strong>Investor Type:</strong> {agreementDataState?.investorType || 'Venture Capital'}</p>
            <p><strong>Investment Range:</strong> {agreementDataState?.investmentRange || '$100K - $1M'}</p>
            <p><strong>Valuation Cap:</strong> {agreementDataState?.valuationCap || '$1,000,000'}</p>
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '20px',
        background: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          color: '#856404', 
          marginTop: 0, 
          marginBottom: '15px', 
          textAlign: 'center',
          fontSize: '1.3rem'
        }}>
          📝 Signatures
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', gap: '30px' }}>
          <div style={{ flex: 1 }}>
            <p><strong>Startup Signature:</strong></p>
            {agreementDataState?.signatures?.find(sig => sig.userType === 'startup' && sig.signature) ? (
              <>
                <img 
                  src={agreementDataState.signatures.find(sig => sig.userType === 'startup' && sig.signature).signature} 
                  alt="Startup Signature" 
                  style={{ maxWidth: '250px', maxHeight: '100px', border: '2px solid #28a745', borderRadius: '8px', padding: '5px', background: 'white' }}
                />
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                  Signed by: {agreementDataState.signatures.find(sig => sig.userType === 'startup' && sig.signature).userName}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {agreementDataState.signatures.find(sig => sig.userType === 'startup' && sig.signature).timestamp 
                    ? new Date(agreementDataState.signatures.find(sig => sig.userType === 'startup' && sig.signature).timestamp).toLocaleString() 
                    : ''}
                </p>
              </>
            ) : (
              <p style={{ color: '#999', fontSize: '1rem' }}>Not signed</p>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <p><strong>Investor Signature:</strong></p>
            {agreementDataState?.signatures?.find(sig => sig.userType === 'investor' && sig.signature) ? (
              <>
                <img 
                  src={agreementDataState.signatures.find(sig => sig.userType === 'investor' && sig.signature).signature} 
                  alt="Investor Signature" 
                  style={{ maxWidth: '250px', maxHeight: '100px', border: '2px solid #28a745', borderRadius: '8px', padding: '5px', background: 'white' }}
                />
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
                  Signed by: {agreementDataState.signatures.find(sig => sig.userType === 'investor' && sig.signature).userName}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {agreementDataState.signatures.find(sig => sig.userType === 'investor' && sig.signature).timestamp 
                    ? new Date(agreementDataState.signatures.find(sig => sig.userType === 'investor' && sig.signature).timestamp).toLocaleString() 
                    : ''}
                </p>
              </>
            ) : (
              <p style={{ color: '#999', fontSize: '1rem' }}>Not signed</p>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleFinalSubmit}
          disabled={isSubmitting}
          style={{
            padding: '15px 40px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: isSubmitting ? '#ccc' : '#28a745',
            color: 'white',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            marginRight: '20px'
          }}
        >
          {isSubmitting ? 'Processing...' : '✅ Final Submit'}
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
            padding: '15px 40px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: '#667eea',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          🏠 Go to Dashboard
        </button>
      </div>
      
      <div style={{ 
        marginTop: '25px', 
        textAlign: 'center', 
        fontSize: '1rem', 
        color: '#666',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p>
          By clicking "Download Final Agreement", you will receive a PDF copy of the finalized agreement.
        </p>
      </div>
    </div>
  );
};

export default FinalAgreementPage;