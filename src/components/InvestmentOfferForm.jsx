import React, { useState } from 'react';

const InvestmentOfferForm = ({ onSendOffer, onCancel }) => {
  const [offerData, setOfferData] = useState({
    investmentAmount: '',
    equityPercentage: '',
    terms: ''
  });
  const [errors, setErrors] = useState({});
  const USD_TO_INR_RATE = 83; // Approximate conversion rate

  // Function to format currency in INR with lakhs/crores
  const formatInrAmount = (amount) => {
    // Convert USD to INR
    const inrAmount = amount * USD_TO_INR_RATE;
    
    // Format in lakhs or crores
    if (inrAmount >= 10000000) { // 1 crore or more
      return `₹${(inrAmount / 10000000).toFixed(2)} Crore`;
    } else if (inrAmount >= 100000) { // 1 lakh or more
      return `₹${(inrAmount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${inrAmount.toLocaleString('en-IN')}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!offerData.investmentAmount.trim()) {
      newErrors.investmentAmount = 'Investment amount is required';
    } else if (isNaN(offerData.investmentAmount) || parseFloat(offerData.investmentAmount) <= 0) {
      newErrors.investmentAmount = 'Please enter a valid investment amount';
    }
    
    if (!offerData.equityPercentage.trim()) {
      newErrors.equityPercentage = 'Equity percentage is required';
    } else if (isNaN(offerData.equityPercentage) || 
               parseFloat(offerData.equityPercentage) <= 0 || 
               parseFloat(offerData.equityPercentage) > 100) {
      newErrors.equityPercentage = 'Please enter a valid equity percentage (0-100)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format the offer data for sending
      const investmentAmount = parseFloat(offerData.investmentAmount);
      const formattedOffer = {
        investmentAmount: investmentAmount,
        equityPercentage: parseFloat(offerData.equityPercentage),
        terms: offerData.terms.trim(),
        investmentAmountInr: formatInrAmount(investmentAmount) // Add INR equivalent
      };
      
      onSendOffer(formattedOffer);
    }
  };

  return (
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
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ 
          color: '#667eea', 
          textAlign: 'center', 
          marginBottom: '25px' 
        }}>
          📈 Send Investment Offer
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Investment Amount (USD) *
            </label>
            <input
              type="number"
              name="investmentAmount"
              value={offerData.investmentAmount}
              onChange={handleChange}
              placeholder="Enter investment amount in USD"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: errors.investmentAmount ? '2px solid #dc3545' : '1px solid #ddd',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {offerData.investmentAmount && !errors.investmentAmount && (
              <div style={{ 
                color: '#28a745', 
                fontSize: '0.9rem', 
                marginTop: '5px',
                fontWeight: 'bold'
              }}>
                Equivalent: {formatInrAmount(parseFloat(offerData.investmentAmount))}
              </div>
            )}
            {errors.investmentAmount && (
              <div style={{ 
                color: '#dc3545', 
                fontSize: '0.9rem', 
                marginTop: '5px' 
              }}>
                {errors.investmentAmount}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Equity/Ownership Percentage *
            </label>
            <input
              type="number"
              name="equityPercentage"
              value={offerData.equityPercentage}
              onChange={handleChange}
              placeholder="Enter equity percentage (e.g., 10 for 10%)"
              min="0"
              max="100"
              step="0.1"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: errors.equityPercentage ? '2px solid #dc3545' : '1px solid #ddd',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.equityPercentage && (
              <div style={{ 
                color: '#dc3545', 
                fontSize: '0.9rem', 
                marginTop: '5px' 
              }}>
                {errors.equityPercentage}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              Terms (Optional)
            </label>
            <textarea
              name="terms"
              value={offerData.terms}
              onChange={handleChange}
              placeholder="Enter any additional terms or conditions..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center' 
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 25px',
                borderRadius: '8px',
                border: '1px solid #6c757d',
                background: 'white',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              style={{
                padding: '12px 25px',
                borderRadius: '8px',
                border: 'none',
                background: '#667eea',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#5a6fd8';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#667eea';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Send Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentOfferForm;