import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Welcome Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        color: 'white'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '20px', 
          fontWeight: 'bold',
          color: 'white'
        }}>
          Find Investors for Startups
        </h1>
        <p style={{ 
          fontSize: '1.3rem', 
          marginBottom: '30px', 
          opacity: '0.95',
          color: 'white'
        }}>
          Connect startups with the right investors and turn your vision into reality
        </p>
      </div>

      {/* User Type Cards */}
      <div style={{ marginTop: '60px' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          color: '#667eea', 
          fontSize: '2rem' 
        }}>
          Choose Your Path
        </h2>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '40px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '40px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '50px 40px',
          width: '380px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          border: '2px solid #bdc3c7',
          transition: 'all 0.4s ease'
        }}>
          <h2 style={{
            color: '#3498db',
            fontSize: '2.2rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>🚀 For Startups</h2>
          <p style={{
            color: '#2c3e50',
            marginBottom: '2.5rem',
            fontSize: '1.1rem',
            lineHeight: '1.8',
            textAlign: 'center'
          }}>Find the perfect investors for your startup and take your business to the next level</p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to="/startup/login" style={{
              display: 'inline-block',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              background: '#3498db',
              color: 'white',
              boxShadow: '0 4px 6px rgba(52, 152, 219, 0.3)'
            }}>Login</Link>
            <Link to="/startup/register" style={{
              display: 'inline-block',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              background: '#34495e',
              color: 'white',
              boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)'
            }}>Register</Link>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '50px 40px',
          width: '380px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          border: '2px solid #bdc3c7',
          transition: 'all 0.4s ease'
        }}>
          <h2 style={{
            color: '#3498db',
            fontSize: '2.2rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>💼 For Investors</h2>
          <p style={{
            color: '#2c3e50',
            marginBottom: '2.5rem',
            fontSize: '1.1rem',
            lineHeight: '1.8',
            textAlign: 'center'
          }}>Discover promising startups and invest in the next big thing</p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link to="/investor/login" style={{
              display: 'inline-block',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              background: '#3498db',
              color: 'white',
              boxShadow: '0 4px 6px rgba(52, 152, 219, 0.3)'
            }}>Login</Link>
            <Link to="/investor/register" style={{
              display: 'inline-block',
              padding: '12px 30px',
              fontSize: '1rem',
              fontWeight: '500',
              textAlign: 'center',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              background: '#34495e',
              color: 'white',
              boxShadow: '0 4px 6px rgba(52, 73, 94, 0.3)'
            }}>Register</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home