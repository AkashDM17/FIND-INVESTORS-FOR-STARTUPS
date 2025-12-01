const API_URL = 'http://localhost:5000/api';

export const startupAPI = {
  register: async (data) => {
    try {
      const response = await fetch(`${API_URL}/startup/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Registration failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  login: async (data) => {
    try {
      const response = await fetch(`${API_URL}/startup/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Login failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  submitPitch: async (data) => {
    try {
      const response = await fetch(`${API_URL}/startup/pitch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Pitch submission failed');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  completeOnboarding: async (email) => {
    try {
      const response = await fetch(`${API_URL}/startup/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to complete onboarding');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // New function to get startup details by email
  getStartupByEmail: async (email) => {
    try {
      const response = await fetch(`${API_URL}/startup/${email}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch startup details');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }
};

export const investorAPI = {
  register: async (data) => {
    try {
      const response = await fetch(`${API_URL}/investor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Registration failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  login: async (data) => {
    try {
      const response = await fetch(`${API_URL}/investor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Login failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  completeOnboarding: async (email) => {
    try {
      const response = await fetch(`${API_URL}/investor/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to complete onboarding');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  // New function to get investor details by email
  getInvestorByEmail: async (email) => {
    try {
      const response = await fetch(`${API_URL}/investor/${email}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch investor details');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }
};

export const pitchAPI = {
  getAllPitches: async () => {
    try {
      const response = await fetch(`${API_URL}/pitches`);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to fetch pitches';
        try {
          const result = await response.json();
          errorMessage = result.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  getPitchById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/pitches/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch pitch');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export const contactAPI = {
  sendContact: async (data) => {
    try {
      const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send contact');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getStartupContacts: async (email) => {
    try {
      const response = await fetch(`${API_URL}/contacts/startup/${email}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch contacts');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getInvestorContacts: async (email) => {
    try {
      const response = await fetch(`${API_URL}/contacts/investor/${email}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch contacts');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  markAsRead: async (id) => {
    try {
      const response = await fetch(`${API_URL}/contacts/${id}/read`, {
        method: 'PUT',
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to mark as read');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  sendMessage: async (data, file = null) => {
    try {
      let response;
      
      if (file) {
        // Handle file upload
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        formData.append('file', file);
        
        response = await fetch(`${API_URL}/messages`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Regular message without file
        response = await fetch(`${API_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
      
      return result;
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      } else if (error.name === 'NetworkError') {
        throw new Error('Network error occurred. Please check your connection and try again.');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error('Connection failed. Please check your internet connection.');
      }
      throw error;
    }
  },
  
  getMessages: async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/messages/${conversationId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch messages');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
};

export const agreementAPI = {
  createAgreement: async (data) => {
    try {
      const response = await fetch(`${API_URL}/agreements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create agreement');
      }
      
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      }
      throw error;
    }
  },
  
  getAgreement: async (id) => {
    try {
      const response = await fetch(`${API_URL}/agreements/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch agreement');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  updateAgreement: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/agreements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update agreement');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  submitAgreement: async (id, signatureData) => {
    try {
      const response = await fetch(`${API_URL}/agreements/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureData),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit agreement');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
  
  getUserAgreements: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/agreements/user/${userId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch user agreements');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  },
};
