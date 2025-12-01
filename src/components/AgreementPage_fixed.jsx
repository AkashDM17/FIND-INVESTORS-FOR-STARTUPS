import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementAPI, investorAPI, startupAPI } from '../api/api';
import { jsPDF } from "jspdf";
// Add signature pad library
import SignaturePad from 'react-signature-pad-wrapper';

const AgreementPage = ({ agreementData: initialAgreementData, userType, agreementId, ideaId }) => {
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementData, setAgreementData] = useState(initialAgreementData);
  const [startupDetails, setStartupDetails] = useState(null);
  const [investorDetails, setInvestorDetails] = useState(null);
  const [preferredIndustries, setPreferredIndustries] = useState(''); // State for preferred industries
  const [startupRegistrationData, setStartupRegistrationData] = useState(null); // State for startup registration data
  const [investorRegistrationData, setInvestorRegistrationData] = useState(null); // State for investor registration data
  const [startupSignature, setStartupSignature] = useState('');
  const [investorSignature, setInvestorSignature] = useState('');
  const [signaturePadRef, setSignaturePadRef] = useState(null);
  
  // Load agreement data based on idea_id if provided
  useEffect(() => {
    // This effect is intentionally left empty for now
    // We might add logic here in the future if needed
  }, []);
  
  // Fetch startup registration details
  useEffect(() => {
    const fetchStartupDetails = async () => {
      if (agreementData?.startupEmail) {
        try {
          const startupData = await startupAPI.getStartupByEmail(agreementData.startupEmail);
          setStartupRegistrationData(startupData);
        } catch (error) {
          console.error('Error fetching startup details for email:', agreementData.startupEmail, error);
        }
      } else if (agreementData?.startupName) {
        // If we don't have an email but have a name, set more meaningful fallback data
        setStartupDetails({
          companyName: agreementData.startupName,
          name: agreementData.startupName,
          founderName: agreementData.startupName,
          ideaTitle: agreementData.businessIdea || 'Innovative Business Solution',
          ideaId: 'BUS-' + Math.random().toString(36).substr(2, 5).toUpperCase(), // Generate a pseudo ID
          fundingAmountRequested: agreementData.investmentAmount || '₹2.5 Crore',
          currentValuation: '₹10 Crore',
          projectTitle: agreementData.businessIdea || 'Innovative Business Solution'
        });
      }
    };
    
    fetchStartupDetails();
  }, [agreementData?.startupEmail, agreementData?.startupName]);
  
  // Fetch investor registration details
  useEffect(() => {
    const fetchInvestorDetails = async () => {
      if (agreementData?.investorEmail) {
        try {
          const investorData = await investorAPI.getInvestorByEmail(agreementData.investorEmail);
          setInvestorRegistrationData(investorData);
          setPreferredIndustries(investorData.preferredIndustries);
          
          // Convert investment range to INR format
          const investmentRangeInr = convertInvestmentRangeToInr(investorData.investmentRange);
          setAgreementData(prev => ({
            ...prev,
            investmentRange: investmentRangeInr
          }));
        } catch (error) {
          console.error('Error fetching investor details for email:', agreementData.investorEmail, error);
        }
      } else if (agreementData?.investorName) {
        // If we don't have an email but have a name, set more meaningful fallback data
        setInvestorDetails({
          fullName: agreementData.investorName,
          investorName: agreementData.investorName,
          investorType: agreementData.investorType || 'Venture Capital',
          companyName: agreementData.investorName + ' Company', // Better fallback
          investmentRange: agreementData.investmentRange || '₹50,00,000 - ₹1,00,00,000', // Better fallback
          preferredIndustries: 'Technology, Healthcare' // Better fallback
        });
      }
    };
    
    fetchInvestorDetails();
  }, [agreementData?.investorEmail, agreementData?.investorName]);
  
  // Convert investment range to INR format
  const convertInvestmentRangeToInr = (range) => {
    const rangeMap = {
      '10k-50k': '₹10,000 - ₹50,000',
      '50k-100k': '₹50,000 - ₹1,00,000',
      '100k-500k': '₹1,00,000 - ₹5,00,000',
      '500k-1m': '₹5,00,000 - ₹10,00,000',
      '1m-plus': '₹10,00,000+'
    };
    
    return rangeMap[range] || range;
  };
  
  // Check if agreement is already finalized on component mount
  useEffect(() => {
    if (agreementId) {
      const checkAgreementStatus = async () => {
        try {
          const updatedAgreement = await agreementAPI.getAgreement(agreementId);
          setAgreementData(updatedAgreement);
          
          // Check if agreement is finalized
          const isFinalized = updatedAgreement.status === 'finalized' || 
                             (updatedAgreement.signatures && updatedAgreement.signatures.length >= 2);
          
          // Check if current user has signed
          const currentUserName = userType === 'startup' ? updatedAgreement.startupName : updatedAgreement.investorName;
          const currentUserHasSigned = updatedAgreement.signatures && 
            updatedAgreement.signatures.some(sig => sig.userName === currentUserName);
          
          // If user has signed and agreement is finalized, redirect to final page
          if (currentUserHasSigned && isFinalized) {
            // Store the finalized agreement data in localStorage for the final page
            localStorage.setItem('finalizedAgreement', JSON.stringify(updatedAgreement));
            localStorage.setItem('agreementUserType', userType);
            
            // Redirect to the final agreement page
            if (userType === 'startup') {
              window.location.href = '/startup/final-agreement';
            } else {
              window.location.href = '/investor/final-agreement';
            }
          }
        } catch (error) {
          console.error('Error checking agreement status:', error);
        }
      };
      
      checkAgreementStatus();
    }
  }, [agreementId, userType]);
  
  // Add polling to fetch updated agreement data
  useEffect(() => {
    let intervalId;
    
    if (agreementId) {
      // Fetch agreement data immediately
      const fetchAgreementData = async () => {
        try {
          const updatedAgreement = await agreementAPI.getAgreement(agreementId);
          console.log('Fetched updated agreement data:', updatedAgreement);
          setAgreementData(updatedAgreement);
          
          // Check if agreement is now finalized
          const isFinalized = updatedAgreement.status === 'finalized' || 
                             (updatedAgreement.signatures && updatedAgreement.signatures.length >= 2);
          
          // Check if current user has signed
          const currentUserName = userType === 'startup' ? updatedAgreement.startupName : updatedAgreement.investorName;
          const currentUserHasSigned = updatedAgreement.signatures && 
            updatedAgreement.signatures.some(sig => sig.userName === currentUserName);
          
          // If user has signed and agreement is finalized, redirect to final page
          if (currentUserHasSigned && isFinalized) {
            // Store the finalized agreement data in localStorage for the final page
            localStorage.setItem('finalizedAgreement', JSON.stringify(updatedAgreement));
            localStorage.setItem('agreementUserType', userType);
            
            // Redirect to the final agreement page
            if (userType === 'startup') {
              window.location.href = '/startup/final-agreement';
            } else {
              window.location.href = '/investor/final-agreement';
            }
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
  }, [agreementId, userType]);
  
  // Automatically download PDF when agreement is finalized
  useEffect(() => {
    if (agreementData && agreementData.status === 'finalized' && !agreementData.pdfDownloaded) {
      // Mark that we've handled the PDF download to prevent multiple downloads
      agreementData.pdfDownloaded = true;
      
      // Generate and download PDF
      generateDetailedAgreementPDF();
      
      // Show notification
      alert('The agreement has been finalized by both parties! The PDF has been downloaded.');
    }
  }, [agreementData]);

  // Handle acknowledgment checkbox
  const handleAcknowledge = (e) => {
    setAcknowledged(e.target.checked);
  };

  // Handle signature input
  const handleSignature = (e) => {
    setSignature(e.target.value);
  };

  // Handle agreement submission with digital signatures
  const handleSubmit = async () => {
    if (!acknowledged) {
      alert('Please acknowledge the terms to continue.');
      return;
    }

    // Check if user has already signed
    const currentUserName = userType === 'startup' ? agreementData.startupName : agreementData.investorName;
    const currentUserHasSigned = agreementData.signatures && 
      agreementData.signatures.some(sig => sig.userName === currentUserName);
      
    // Check if other party has signed
    const otherUserName = userType === 'startup' ? agreementData.investorName : agreementData.startupName;
    const otherPartyHasSigned = agreementData.signatures && 
      agreementData.signatures.some(sig => sig.userName === otherUserName);
      
    // If both parties have already signed, redirect immediately
    if (currentUserHasSigned && otherPartyHasSigned) {
      // Store the finalized agreement data in localStorage for the final page
      localStorage.setItem('finalizedAgreement', JSON.stringify(agreementData));
      localStorage.setItem('agreementUserType', userType);
      
      // Generate and download PDF automatically if not already done
      if (!agreementData.pdfDownloaded) {
        generateDetailedAgreementPDF();
      }
      
      // Show notification
      alert('Both parties have already signed the agreement! Redirecting to the final page...');
      
      // Redirect to the final agreement page
      setTimeout(() => {
        if (userType === 'startup') {
          window.location.href = '/startup/final-agreement';
        } else {
          window.location.href = '/investor/final-agreement';
        }
      }, 1000);
      return;
    }
      
    if (currentUserHasSigned) {
      // User has signed but other party hasn't
      // Store agreement ID for status page
      if (agreementId) {
        localStorage.setItem('currentAgreementId', agreementId);
      }
      
      // Redirect to signature status page
      if (userType === 'startup') {
        window.location.href = '/startup/signature-status';
      } else {
        window.location.href = '/investor/signature-status';
      }
      return;
    }

    // Get signature data from pad
    let signatureDataUrl = null;
    if (signaturePadRef && !signaturePadRef.isEmpty()) {
      signatureDataUrl = signaturePadRef.toDataURL();
    }

    if (!signatureDataUrl) {
      alert('Please provide your signature before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare signature data based on user type
      const signatureData = {
        userId: localStorage.getItem('userId'),
        userName: userType === 'startup' ? agreementData.startupName : agreementData.investorName,
        userType: userType,
        signature: signatureDataUrl,
        acknowledged: acknowledged,
        timestamp: new Date().toISOString()
      };
      
      // Submit the agreement with signature
      await submitSignature(signatureData);
      
    } catch (error) {
      console.error('Error in agreement submission:', error);
      alert('Failed to submit agreement: ' + error.message);
      setIsSubmitting(false);
    }
  };

  // Helper function to submit signature with detailed logging
  const submitSignature = async (signatureData) => {
    try {
      console.log('Submitting signature data:', signatureData);
      
      let updatedAgreement;
      if (agreementId) {
        // Check if user has already signed
        const currentUserName = userType === 'startup' ? agreementData.startupName : agreementData.investorName;
        const currentUserHasSigned = agreementData.signatures && 
          agreementData.signatures.some(sig => sig.userName === currentUserName);
          
        console.log('Current user signature check:', {
          currentUserName: currentUserName,
          currentUserHasSigned: currentUserHasSigned,
          existingSignatures: agreementData.signatures
        });
          
        // If user has already signed, just update the agreement data
        if (currentUserHasSigned) {
          // Refresh the agreement data to get the latest state
          console.log('User already signed, fetching latest agreement data');
          updatedAgreement = await agreementAPI.getAgreement(agreementId);
        } else {
          // Submit the new signature
          console.log('Submitting new signature');
          updatedAgreement = await agreementAPI.submitAgreement(agreementId, { signatureData });
        }
        
        // Update local state with the response
        setAgreementData(updatedAgreement);
        console.log('Agreement updated with signature:', updatedAgreement);
      } else {
        // Fallback for when agreementId is not provided
        console.log('Agreement submitted with signature (fallback):', signatureData);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        updatedAgreement = { 
          status: 'in-progress', 
          signatures: agreementData.signatures ? [...agreementData.signatures, signatureData] : [signatureData],
          startupSignature: userType === 'startup' ? signatureData.signature : agreementData.startupSignature,
          investorSignature: userType === 'investor' ? signatureData.signature : agreementData.investorSignature
        };
        setAgreementData(updatedAgreement);
      }
      
      // Store agreement ID for status page
      if (agreementId) {
        localStorage.setItem('currentAgreementId', agreementId);
      }
      
      // Check if agreement is now finalized (both parties signed)
      const isFinalized = updatedAgreement.status === 'finalized' || 
                         (updatedAgreement.signatures && updatedAgreement.signatures.length >= 2);
      
      console.log('Agreement finalization check:', {
        status: updatedAgreement.status,
        signatureCount: updatedAgreement.signatures ? updatedAgreement.signatures.length : 0,
        isFinalized: isFinalized
      });
      
      if (isFinalized) {
        // Update agreement status
        if (agreementId) {
          try {
            const statusUpdate = await agreementAPI.updateAgreement(agreementId, { status: 'Signed' });
            setAgreementData(statusUpdate);
          } catch (updateError) {
            console.error('Error updating agreement status:', updateError);
          }
        }
        
        // Store the finalized agreement data in localStorage for the final page
        localStorage.setItem('finalizedAgreement', JSON.stringify(updatedAgreement));
        localStorage.setItem('agreementUserType', userType);
        
        // Generate and download PDF automatically
        await generateDetailedAgreementPDF();
        
        // Show success message
        alert('Agreement Signed! Both parties have successfully signed the agreement. The PDF has been downloaded.');
        
        // Redirect to the final agreement page
        setTimeout(() => {
          if (userType === 'startup') {
            window.location.href = '/startup/final-agreement';
          } else {
            window.location.href = '/investor/final-agreement';
          }
        }, 3000);
      } else {
        // Not finalized yet, redirect to signature status page
        if (userType === 'startup') {
          window.location.href = '/startup/signature-status';
        } else {
          window.location.href = '/investor/signature-status';
        }
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      alert('Failed to submit signature: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the current user has signed (simplified detection)
  const hasCurrentUserSigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check by user type - this is the most reliable method
    return agreementData.signatures.some(sig => sig.userType === userType);
  };

  // Check if the other party has signed (simplified detection)
  const hasOtherPartySigned = () => {
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check by opposite user type
    const otherUserType = userType === 'startup' ? 'investor' : 'startup';
    return agreementData.signatures.some(sig => sig.userType === otherUserType);
  };

  // Check if both parties have signed (simplified detection)
  const hasBothPartiesSigned = () => {
    // Check if we have agreement data
    if (!agreementData || !agreementData.signatures) {
      return false;
    }
    
    // Check both parties by user type
    const startupSigned = agreementData.signatures.some(sig => sig.userType === 'startup');
    const investorSigned = agreementData.signatures.some(sig => sig.userType === 'investor');
    
    return startupSigned && investorSigned;
  };

  // Effect to automatically redirect when both parties have signed
  useEffect(() => {
    // Only check if we have agreement data
    if (!agreementData || !agreementData.signatures) return;
    
    // Debug logging
    console.log('Checking signature status:', {
      userType,
      signatures: agreementData.signatures,
      currentUserSigned: hasCurrentUserSigned(),
      otherPartySigned: hasOtherPartySigned(),
      bothSigned: hasBothPartiesSigned()
    });
    
    // Check if both parties have signed
    if (hasBothPartiesSigned()) {
      // Store the finalized agreement data in localStorage for the final page
      localStorage.setItem('finalizedAgreement', JSON.stringify(agreementData));
      localStorage.setItem('agreementUserType', userType);
      
      // Generate and download PDF automatically if not already done
      if (!agreementData.pdfDownloaded) {
        generateDetailedAgreementPDF();
        // Mark that we've handled the PDF download
        setAgreementData(prev => ({...prev, pdfDownloaded: true}));
      }
      
      // Show notification
      alert('Both parties have signed the agreement! Redirecting to the final page...');
      
      // Redirect to the final agreement page after a short delay
      setTimeout(() => {
        if (userType === 'startup') {
          window.location.href = '/startup/final-agreement';
        } else {
          window.location.href = '/investor/final-agreement';
        }
      }, 2000);
    }
  }, [agreementData, userType]);

  // Get signature details for display
  const getSignatureDetails = () => {
    if (!agreementData || !agreementData.signatures) return [];
    
    const currentUserName = userType === 'startup' ? agreementData.startupName : agreementData.investorName;
    const otherUserName = userType === 'startup' ? agreementData.investorName : agreementData.startupName;
    
    const currentUserSignature = agreementData.signatures.find(sig => sig.userName === currentUserName);
    const otherPartySignature = agreementData.signatures.find(sig => sig.userName === otherUserName);
    
    return [
      {
        party: userType === 'startup' ? 'Startup' : 'Investor',
        name: currentUserName,
        signed: !!currentUserSignature,
        signature: currentUserSignature ? currentUserSignature.signature : '',
        timestamp: currentUserSignature ? new Date(currentUserSignature.timestamp).toLocaleString() : ''
      },
      {
        party: userType === 'startup' ? 'Investor' : 'Startup',
        name: otherUserName,
        signed: !!otherPartySignature,
        signature: otherPartySignature ? otherPartySignature.signature : '',
        timestamp: otherPartySignature ? new Date(otherPartySignature.timestamp).toLocaleString() : ''
      }
    ];
  };

  // Format the current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate detailed agreement PDF
  const generateDetailedAgreementPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(22);
    doc.text('Investment Agreement', 105, 20, null, null, 'center');
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 105, 30, null, null, 'center');
    
    // Add startup details section
    doc.setFontSize(16);
    doc.text('Startup Details', 20, 45);
    
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);
    
    doc.setFontSize(12);
    doc.text(`Company Name: ${startupDetails?.companyName || 'Tech Innovations Ltd'}`, 20, 57);
    doc.text(`Founder Name: ${startupDetails?.founderName || 'Ramesh Kumar'}`, 20, 67);
    doc.text(`Idea Title: ${startupDetails?.ideaTitle || 'AI-Powered Healthcare Diagnostics'}`, 20, 77);
    doc.text(`Idea ID: ${startupDetails?.ideaId || 'uhub'}`, 20, 87);
    doc.text(`Funding Amount Requested: ${startupDetails?.fundingAmountRequested || '₹2.5 Crore'}`, 20, 97);
    doc.text(`Current Valuation: ${startupDetails?.currentValuation || '₹10 Crore'}`, 20, 107);
    
    // Add investor details section
    doc.setFontSize(16);
    doc.text('Investor Details', 20, 122);
    
    doc.setLineWidth(0.5);
    doc.line(20, 124, 190, 124);
    
    doc.setFontSize(12);
    doc.text(`Investor Name: ${investorRegistrationData?.fullName || investorDetails?.investorName || 'Venture Capital Partners'}`, 20, 134);
    doc.text(`Investor Company: ${investorRegistrationData?.companyName || 'N/A'}`, 20, 144);
    doc.text(`Investor Type: ${investorRegistrationData?.investorType || investorDetails?.investorType || 'Venture Capital'}`, 20, 154);
    doc.text(`Investment Range: N/A`, 20, 164);
    doc.text(`Preferred Industries: N/A`, 20, 174);
    
    // Add investment terms section
    doc.setFontSize(16);
    doc.text('Investment Terms', 20, 189);
    
    doc.setLineWidth(0.5);
    doc.line(20, 191, 190, 191);
    
    doc.setFontSize(12);
    doc.text(`Investment Amount: ${startupDetails?.fundingAmountRequested || '₹2.5 Crore'}`, 20, 201);
    doc.text(`Ownership Percentage: ${agreementData?.equityStake || '20%'}`, 20, 211);
    doc.text(`Pre-Money Valuation: ${startupDetails?.currentValuation || '₹10 Crore'}`, 20, 221);
    doc.text(`Post-Money Valuation: ${startupDetails?.currentValuation ? calculatePostMoneyValuation(startupDetails.currentValuation, startupDetails.fundingAmountRequested) : '₹12.5 Crore'}`, 20, 231);
    doc.text(`Valuation Cap: ${agreementData?.valuationCap || '₹25 Crore'}`, 20, 241);
    doc.text(`Discount Rate: N/A`, 20, 251);
    doc.text(`Payment Schedule: ${agreementData?.paymentSchedule || 'To be determined upon mutual agreement'}`, 20, 261);
    
    // Continue on next page if needed
    if (doc.internal.getNumberOfPages() === 1) {
      doc.addPage();
    }
    
    doc.setFontSize(12);
    doc.text(`Investor Rights:`, 20, 20);
    doc.text(`- Board representation proportional to equity stake`, 25, 30);
    doc.text(`- Information rights as per company bylaws`, 25, 40);
    doc.text(`- Preemptive rights for future funding rounds`, 25, 50);
    doc.text(`- Exit strategy and liquidation preferences to be defined separately`, 25, 60);
    
    doc.text(`Founder Responsibilities:`, 20, 70);
    doc.text(`- Provide accurate financial statements quarterly`, 25, 80);
    doc.text(`- Maintain confidentiality of proprietary information`, 25, 90);
    doc.text(`- Participate in board meetings as required`, 25, 100);
    doc.text(`- Comply with all legal and regulatory requirements`, 25, 110);
    
    doc.text(`Confidentiality Clause:`, 20, 120);
    doc.text(`- Confidentiality period of 5 years from agreement date`, 25, 130);
    doc.text(`- Non-disclosure of proprietary information`, 25, 140);
    doc.text(`- Exceptions for legal requirements and public information`, 25, 150);
    
    // Add signatures section on a new page
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Signatures', 105, 20, null, null, 'center');
    
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Startup Signature
    doc.setFontSize(14);
    doc.text('Startup Representative:', 20, 40);
    doc.setFontSize(12);
    doc.text(`Name: ${agreementData?.startupName || startupDetails?.companyName || 'Tech Innovations Ltd'}`, 20, 50);
    doc.text(`Date: ${currentDate}`, 20, 60);
    doc.text('Signature:', 20, 70);
    
    // Add startup signature if available
    if (agreementData?.startupSignature) {
      doc.addImage(agreementData.startupSignature, 'PNG', 20, 75, 60, 20);
    } else {
      doc.setLineWidth(0.5);
      doc.line(20, 80, 100, 80); // Signature line
    }
    
    // Investor Signature
    doc.setFontSize(14);
    doc.text('Investor Representative:', 20, 120);
    doc.setFontSize(12);
    doc.text(`Name: ${agreementData?.investorName || investorDetails?.investorName || 'Venture Capital Partners'}`, 20, 130);
    doc.text(`Date: ${currentDate}`, 20, 140);
    doc.text('Signature:', 20, 150);
    
    // Add investor signature if available
    if (agreementData?.investorSignature) {
      doc.addImage(agreementData.investorSignature, 'PNG', 20, 155, 60, 20);
    } else {
      doc.setLineWidth(0.5);
      doc.line(20, 160, 100, 160); // Signature line
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.text('This document represents a legally binding agreement between the parties.', 105, 285, null, null, 'center');
    doc.text(`Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()}`, 105, 290, null, null, 'center');
    
    // Save the PDF
    doc.save(`detailed-investment-agreement-${startupDetails?.companyName || 'startup'}-${investorDetails?.investorName || 'investor'}.pdf`);
  };
  
  // Helper function to calculate post-money valuation
  const calculatePostMoneyValuation = (preMoneyValuation, investmentAmount) => {
    // This is a simplified calculation - in a real app, you'd have more complex logic
    if (!preMoneyValuation || !investmentAmount) return 'N/A';
    
    // Extract numeric values
    const preMoney = parseFloat(preMoneyValuation.replace(/[^0-9.]/g, ''));
    const investment = parseFloat(investmentAmount.replace(/[^0-9.]/g, ''));
    
    if (isNaN(preMoney) || isNaN(investment)) return 'N/A';
    
    const postMoney = preMoney + investment;
    
    // Format back to INR with appropriate units
    if (postMoney >= 10000000) {
      return `₹${(postMoney / 10000000).toFixed(2)} Crore`;
    } else if (postMoney >= 100000) {
      return `₹${(postMoney / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${postMoney.toLocaleString('en-IN')}`;
    }
  };

  // Function to parse and display only INR amounts
  const formatInvestmentAmount = (amount) => {
    if (!amount) return '₹83,00,000';
    
    // If the amount is already in INR format, return as is
    if (typeof amount === 'string' && amount.includes('₹')) {
      return amount;
    }
    
    // Handle different formats of USD amounts
    let numericValue;
    
    if (typeof amount === 'number') {
      numericValue = amount;
    } else if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal point and commas
      // This will handle formats like "$87,654", "$100,000.50", "87654", etc.
      numericValue = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    } else {
      return '₹83,00,000';
    }
    
    if (isNaN(numericValue)) return '₹83,00,000';
    
    // Using approximate exchange rate: 1 USD = 83 INR (you may want to fetch real-time rates)
    const exchangeRate = 83;
    const inrAmount = numericValue * exchangeRate;
    
    // Format as currency with Indian numbering system (lakhs/crores)
    if (inrAmount >= 10000000) { // 1 crore or more
      return `₹${(inrAmount / 10000000).toFixed(2)} Crore`;
    } else if (inrAmount >= 100000) { // 1 lakh or more
      return `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${inrAmount.toLocaleString('en-IN')}`;
    }
  };

  // Function to convert Valuation Cap from USD to INR
  const formatValuationCap = (amount) => {
    if (!amount) return '₹8,30,00,000';
    
    // If the amount is already in INR format, return as is
    if (typeof amount === 'string' && amount.includes('₹')) {
      return amount;
    }
    
    // Handle different formats of USD amounts
    let numericValue;
    
    if (typeof amount === 'number') {
      numericValue = amount;
    } else if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal point and commas
      // This will handle formats like "$87,654", "$100,000.50", "87654", etc.
      numericValue = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    } else {
      return '₹8,30,00,000';
    }
    
    if (isNaN(numericValue)) return '₹8,30,00,000';
    
    // Using approximate exchange rate: 1 USD = 83 INR (you may want to fetch real-time rates)
    const exchangeRate = 83;
    const inrAmount = numericValue * exchangeRate;
    
    // Format as currency with Indian numbering system (lakhs/crores)
    if (inrAmount >= 10000000) { // 1 crore or more
      return `₹${(inrAmount / 10000000).toFixed(2)} Crore`;
    } else if (inrAmount >= 100000) { // 1 lakh or more
      return `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${inrAmount.toLocaleString('en-IN')}`;
    }
  };

  // Function to convert Investment Range from USD to INR (in lakhs format)
  const formatInvestmentRange = (range) => {
    if (!range) return '₹83 lakh - ₹8.3 crore';
    
    // Extract the numeric values from the range (e.g., "$100K - $1M")
    // This regex will match numbers with K, M, B suffixes
    const regex = /\$([0-9]+[KMB]?)/g;
    const matches = range.match(regex);
    
    if (!matches || matches.length === 0) {
      // If we can't parse the range, convert the whole string if it contains a dollar amount
      if (range.includes('$')) {
        const inrAmount = convertUsdToInr(range);
        return inrAmount ? `~${inrAmount}` : '₹83 lakh - ₹8.3 crore';
      }
      return range; // Return as is if no dollar amount
    }
    
    // Convert each matched amount
    const convertedAmounts = matches.map(match => {
      // Remove the dollar sign
      const valueStr = match.replace('$', '');
      
      // Convert K, M, B suffixes to numeric values
      let numericValue;
      if (valueStr.endsWith('K')) {
        numericValue = parseFloat(valueStr.replace('K', '')) * 1000;
      } else if (valueStr.endsWith('M')) {
        numericValue = parseFloat(valueStr.replace('M', '')) * 1000000;
      } else if (valueStr.endsWith('B')) {
        numericValue = parseFloat(valueStr.replace('B', '')) * 1000000000;
      } else {
        numericValue = parseFloat(valueStr);
      }
      
      // Convert to INR using our exchange rate
      const inrValue = numericValue * 83; // 1 USD = 83 INR
      
      // Format in lakhs or crores
      if (inrValue >= 10000000) { // 1 crore or more
        return `₹${(inrValue / 10000000).toFixed(1)} crore`;
      } else if (inrValue >= 100000) { // 1 lakh or more
        return `₹${(inrValue / 100000).toFixed(0)} lakh`;
      } else {
        return `₹${inrValue.toLocaleString('en-IN')}`;
      }
    });
    
    // Join the converted amounts with " - "
    return convertedAmounts.join(' - ');
  };

  // Function to convert USD to INR (using approximate exchange rate)
  const convertUsdToInr = (usdAmount) => {
    // Handle different formats of USD amounts
    let numericValue;
    
    if (typeof usdAmount === 'number') {
      numericValue = usdAmount;
    } else if (typeof usdAmount === 'string') {
      // Remove any non-numeric characters except decimal point and commas
      // This will handle formats like "$87,654", "$100,000.50", "87654", etc.
      numericValue = parseFloat(usdAmount.replace(/[^0-9.-]+/g, ""));
    } else {
      return null;
    }
    
    if (isNaN(numericValue)) return null;
    
    // Using approximate exchange rate: 1 USD = 83 INR (you may want to fetch real-time rates)
    const exchangeRate = 83;
    const inrAmount = numericValue * exchangeRate;
    
    // Format as currency with Indian numbering system (lakhs/crores)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(inrAmount);
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
      <h1 style={{ color: '#667eea', textAlign: 'center', marginBottom: '30px' }}>Investment Agreement</h1>
      
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <strong>Date of Agreement:</strong> {currentDate}
      </div>
      
      {/* Show status message if user has already signed */}
      {hasCurrentUserSigned() && (
        <div style={{
          padding: '20px',
          background: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            color: '#856404', 
            margin: '0 0 10px 0',
            fontSize: '1.5rem'
          }}>
            ✅ You Have Already Signed This Agreement
          </h2>
          {hasOtherPartySigned() ? (
            <p style={{ fontSize: '1.1rem', margin: '10px 0' }}>
              ✅ The other party has also signed. Redirecting to final agreement page...
            </p>
          ) : (
            <p style={{ fontSize: '1.1rem', margin: '10px 0' }}>
              ⏳ Waiting for the other party to sign the agreement.
            </p>
          )}
        </div>
      )}
      
      {/* Show general waiting message if user hasn't signed yet but agreement has signatures */}
      {!hasCurrentUserSigned() && agreementData?.signatures && agreementData.signatures.length > 0 && (
        <div style={{
          padding: '20px',
          background: '#d1ecf1',
          borderRadius: '8px',
          border: '1px solid #bee5eb',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            color: '#0c5460', 
            margin: '0 0 10px 0',
            fontSize: '1.5rem'
          }}>
            ⏳ Agreement in Progress
          </h2>
          <p style={{ fontSize: '1.1rem', margin: '10px 0' }}>
            Another party has signed. Please review and sign to complete the agreement.
          </p>
        </div>
      )}
      
      {/* Two-column layout for startup and investor details */}
      <div style={{
        display: 'flex',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Startup Details - Left Column */}
        <div style={{
          flex: '1',
          border: '2px solid #667eea',
          borderRadius: '8px',
          padding: '25px',
          background: '#f8f9fa'
        }}>
          <h2 style={{ 
            color: '#667eea', 
            textAlign: 'center', 
            borderBottom: '2px solid #667eea',
            paddingBottom: '15px',
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            🚀 Startup Details (Auto-Fetch & Read-Only)
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Company Name:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {startupRegistrationData?.companyName || startupDetails?.companyName || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Founder Name:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {startupRegistrationData?.name || startupDetails?.founderName || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Idea Title:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {startupRegistrationData?.projectTitle || startupDetails?.ideaTitle || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Idea ID:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {startupRegistrationData?.ideaId || startupDetails?.ideaId || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Funding Amount Requested:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px',
              fontWeight: 'bold',
              color: '#28a745'
            }}>
              {startupRegistrationData?.fundingNeeded || startupDetails?.fundingAmountRequested || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Current Valuation:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px',
              fontWeight: 'bold',
              color: '#28a745'
            }}>
              {startupRegistrationData?.currentValuation || startupDetails?.currentValuation || 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Investor Details - Right Column */}
        <div style={{
          flex: '1',
          border: '2px solid #667eea',
          borderRadius: '8px',
          padding: '25px',
          background: '#f8f9fa'
        }}>
          <h2 style={{ 
            color: '#667eea', 
            textAlign: 'center', 
            borderBottom: '2px solid #667eea',
            paddingBottom: '15px',
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            💼 Investor Details (Auto-Fetch & Read-Only)
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Investor Name:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {investorRegistrationData?.fullName || investorDetails?.investorName || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Investor Company:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {investorRegistrationData?.companyName || investorDetails?.companyName || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Investor Type:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {investorRegistrationData?.investorType || investorDetails?.investorType || 'N/A'}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Investment Range:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {investorRegistrationData?.investmentRange ? 
                convertInvestmentRangeToInr(investorRegistrationData.investmentRange) : 
                (investorDetails?.investmentRange && investorDetails.investmentRange !== 'N/A' ? 
                  investorDetails.investmentRange : 
                  '₹10,00,000 - ₹10,00,000')}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <strong>Preferred Industries:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              {investorRegistrationData?.preferredIndustries || investorDetails?.preferredIndustries || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Agreement Overview Section */}
      <div style={{
        border: '2px solid #28a745',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        background: '#f8f9fa'
      }}>
        <h2 style={{ 
          color: '#28a745', 
          textAlign: 'center', 
          borderBottom: '2px solid #28a745',
          paddingBottom: '15px',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          📋 Agreement Overview
        </h2>
        
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <strong>Agreement Type:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              <input
                type="text"
                value={agreementData?.agreementType || 'Equity Investment Agreement'}
                onChange={(e) => setAgreementData(prev => ({...prev, agreementType: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <strong>Effective Date:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              <input
                type="text"
                value={agreementData?.effectiveDate || currentDate}
                onChange={(e) => setAgreementData(prev => ({...prev, effectiveDate: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <strong>Agreement Term:</strong>
            <div style={{ 
              padding: '10px', 
              background: 'white', 
              borderRadius: '5px', 
              border: '1px solid #ddd',
              marginTop: '5px' 
            }}>
              <input
                type="text"
                value={agreementData?.agreementTerm || 'Until completion of exit event'}
                onChange={(e) => setAgreementData(prev => ({...prev, agreementTerm: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project Description Section */}
      <div style={{
        border: '2px solid #17a2b8',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        background: '#f8f9fa'
      }}>
        <h2 style={{ 
          color: '#17a2b8', 
          textAlign: 'center', 
          borderBottom: '2px solid #17a2b8',
          paddingBottom: '15px',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          ℹ️ Project Description
        </h2>
        
        <div style={{ 
          padding: '15px', 
          background: 'white', 
          borderRadius: '5px', 
          border: '1px solid #ddd',
          marginTop: '5px',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          <p>
            Our project is an Investor–Startup Collaboration System where startups post ideas and investors show interest. 
            When both agree, the system automatically generates an agreement. Digital signing is done by accepting the terms 
            and signing electronically. The system records the timestamp, user identity, and document hash, ensuring trust 
            and preventing tampering. Both parties receive a digitally signed document as proof of collaboration.
          </p>
          <p>
            <strong>Agreement Process:</strong>
          </p>
          <ol>
            <li>Both parties review the agreement terms</li>
            <li>Each party acknowledges acceptance of the terms</li>
            <li>Parties click "Accept & Sign Agreement" to finalize</li>
            <li>The agreement becomes legally binding upon both parties' acceptance</li>
            <li>Both parties receive a digitally signed document as proof</li>
          </ol>
          <p>
            <strong>Security Features:</strong> All signatures are timestamped and logged for trust and security.
          </p>
        </div>
      </div>

      <div style={{
        border: '2px solid #ffc107',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        background: '#fff8e1'
      }}>
        <h3 style={{ color: '#667eea', marginTop: 0, textAlign: 'center', fontSize: '1.3rem' }}>Acknowledgement</h3>
        <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={handleAcknowledge}
            style={{ 
              marginTop: '4px',
              marginRight: '15px',
              transform: 'scale(1.3)'
            }}
          />
          <span style={{ fontSize: '1.1rem' }}>
            I acknowledge that I have read and understood the terms of this agreement and agree to be bound by them.
          </span>
        </label>

        <div style={{ 
          padding: '15px', 
          background: 'white', 
          borderRadius: '5px', 
          border: '1px solid #ddd',
          marginTop: '20px',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          <p>
            <strong>Agreement Acceptance Process:</strong>
          </p>
          <p>
            To finalize this agreement:
          </p>
          <ol>
            <li>Review all terms and conditions carefully</li>
            <li>Check the acknowledgment box to confirm your understanding</li>
            <li>Sign the agreement in the signature box below</li>
            <li>Click the "Accept & Sign Agreement" button</li>
            <li>Your signature will be recorded with a timestamp</li>
            <li>Once both parties have signed, the agreement becomes legally binding</li>
            <li>A PDF copy will be automatically generated and downloaded</li>
          </ol>
          <p>
            <strong>Note:</strong> Both parties must complete this process for the agreement to be finalized.
          </p>
        </div>
      </div>

      {/* Digital Signature Section */}
      <div style={{
        border: '2px solid #28a745',
        borderRadius: '8px',
        padding: '25px',
        marginBottom: '30px',
        background: '#f8f9fa'
      }}>
        <h3 style={{ 
          color: '#28a745', 
          marginTop: 0, 
          textAlign: 'center', 
          fontSize: '1.3rem' 
        }}>
          ✍️ Digital Signature
        </h3>
        
        <div style={{ 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
            Please sign below to confirm your acceptance of this agreement
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
            (Signature will be recorded as legally binding proof of agreement)
          </p>
        </div>
        
        {/* Signature Pad */}
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: 'white',
          margin: '0 auto 20px',
          maxWidth: '600px'
        }}>
          <SignaturePad
            ref={setSignaturePadRef}
            options={{
              penColor: 'black',
              backgroundColor: 'rgb(255,255,255)',
              minWidth: 1,
              maxWidth: 3
            }}
            style={{
              width: '100%',
              height: '150px'
            }}
          />
        </div>
        
        {/* Signature Controls */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => signaturePadRef && signaturePadRef.clear()}
            style={{
              padding: '8px 15px',
              fontSize: '0.9rem',
              borderRadius: '4px',
              border: '1px solid #dc3545',
              background: 'white',
              color: '#dc3545',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Clear Signature
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={!acknowledged || isSubmitting}
          style={{
            padding: '15px 40px',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: (!acknowledged || isSubmitting) ? '#ccc' : '#667eea',
            color: 'white',
            cursor: (!acknowledged || isSubmitting) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Processing Agreement...' : '✅ Accept & Sign Agreement'}
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
        <p>By submitting this agreement, both parties agree to the terms outlined above.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          This agreement will be legally binding once both parties have accepted and signed.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleSubmit}
          disabled={!acknowledged || isSubmitting}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: 'none',
            background: (!acknowledged || isSubmitting) ? '#ccc' : '#667eea',
            color: 'white',
            cursor: (!acknowledged || isSubmitting) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Processing Agreement...' : '✅ Accept & Sign Agreement'}
        </button>
      </div>
      
      {/* Remove the OTP buttons as requested */}
      {/* 
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleReceivedOTP}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: '1px solid #667eea',
            background: 'white',
            color: '#667eea',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          🔔 Check for OTP Notifications
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!acknowledged || isSubmitting}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: 'none',
            background: (!acknowledged || isSubmitting) ? '#ccc' : '#667eea',
            color: 'white',
            cursor: (!acknowledged || isSubmitting) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          {isSubmitting ? 'Processing OTP Verification...' : '📤 Send OTP to Other Party'}
        </button>
      </div>
      */}
      
      <div style={{ 
        marginTop: '25px', 
        textAlign: 'center', 
        fontSize: '1rem', 
        color: '#666',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p>By submitting this agreement, both parties agree to the terms outlined above.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
          This agreement will be legally binding once both parties have accepted and signed.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={generateDetailedAgreementPDF}
          disabled={!hasBothPartiesSigned()}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '6px',
            border: 'none',
            background: !hasBothPartiesSigned() ? '#ccc' : '#667eea',
            color: 'white',
            cursor: !hasBothPartiesSigned() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold'
          }}
        >
          {!hasCurrentUserSigned() ? '🔒 Sign to Enable Download' : 
           !hasOtherPartySigned() ? '⏳ Waiting for Other Party' : '📄 Download Agreement as PDF'}
        </button>
        
        {!hasCurrentUserSigned() && (
          <div style={{ 
            marginTop: '10px', 
            color: '#667eea', 
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            Please sign the agreement above to enable download
          </div>
        )}
        
        {hasCurrentUserSigned() && !hasOtherPartySigned() && (
          <div style={{ 
            marginTop: '10px', 
            color: '#ffc107', 
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            Waiting for the other party to sign the agreement
          </div>
        )}
        
        {hasBothPartiesSigned() && (
          <div style={{ 
            marginTop: '10px', 
            color: '#28a745', 
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}>
            ✅ Both parties have signed. Download enabled.
          </div>
        )}
      </div>
      
      {/* Signature Status Table */}
      <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ 
            color: '#667eea', 
            marginTop: 0, 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: '1.3rem'
          }}>
            📝 Signature Status
          </h3>
          
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ background: '#667eea', color: 'white' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Party</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Signature</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {getSignatureDetails().map((party, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      background: index % 2 === 0 ? '#f8f9fa' : 'white',
                      borderBottom: '1px solid #dee2e6'
                    }}
                  >
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{party.party}</td>
                    <td style={{ padding: '12px 15px' }}>{party.name}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: party.signed ? '#d4edda' : '#f8d7da',
                        color: party.signed ? '#155724' : '#721c24'
                      }}>
                        {party.signed ? '✅ Signed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {party.signed ? party.signature : '-'}
                    </td>
                    <td style={{ padding: '12px 15px', fontSize: '0.9rem' }}>
                      {party.signed ? party.timestamp : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: '#e9ecef',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            <strong>Note:</strong> This table updates in real-time. The agreement PDF will be automatically downloaded when both parties have signed.
          </div>
        </div>
    </div>
  );
};

export default AgreementPage;