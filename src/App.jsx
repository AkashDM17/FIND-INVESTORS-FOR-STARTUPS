import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import StartupLogin from './pages/StartupLogin'
import StartupRegister from './pages/StartupRegister'
import StartupDashboard from './pages/StartupDashboard'
import InvestorLogin from './pages/InvestorLogin'
import InvestorRegister from './pages/InvestorRegister'
import InvestorDashboard from './pages/InvestorDashboard'
import BrowseStartups from './pages/BrowseStartups'
import BrowseInvestors from './pages/BrowseInvestors'
import Notifications from './pages/Notifications'
import UnifiedRegister from './pages/UnifiedRegister'
import SavedStartups from './pages/SavedStartups'
import AgreementPage from './components/AgreementPage';
import FinalAgreementPage from './components/FinalAgreementPage';
import SignatureStatusPage from './components/SignatureStatusPage';
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<UnifiedRegister />} />
          <Route path="/startup/login" element={<StartupLogin />} />
          <Route path="/startup/register" element={<StartupRegister />} />
          <Route path="/startup/dashboard" element={<StartupDashboard />} />
          <Route path="/startup/browse-investors" element={<BrowseInvestors />} />
          <Route path="/startup/notifications" element={<Notifications />} />
          <Route path="/startup/signature-status" element={<SignatureStatusPageWrapper userType="startup" />} />
          <Route path="/startup/final-agreement" element={<FinalAgreementPageWrapper userType="startup" />} />
          <Route path="/investor/login" element={<InvestorLogin />} />
          <Route path="/investor/register" element={<InvestorRegister />} />
          <Route path="/investor/dashboard" element={<InvestorDashboard />} />
          <Route path="/investor/browse-startups" element={<BrowseStartups />} />
          <Route path="/investor/saved-startups" element={<SavedStartups />} />
          <Route path="/investor/notifications" element={<Notifications />} />
          <Route path="/investor/signature-status" element={<SignatureStatusPageWrapper userType="investor" />} />
          <Route path="/investor/final-agreement" element={<FinalAgreementPageWrapper userType="investor" />} />
          <Route path="/agreement" element={<AgreementPage />} />
        </Routes>
      </div>
    </Router>
  )
}

// Wrapper component to pass data to FinalAgreementPage
const FinalAgreementPageWrapper = ({ userType }) => {
  // Get agreement data from localStorage
  const agreementData = JSON.parse(localStorage.getItem('finalizedAgreement') || '{}');
  
  return <FinalAgreementPage agreementData={agreementData} userType={userType} />;
}

// Wrapper component to pass data to SignatureStatusPage
const SignatureStatusPageWrapper = ({ userType }) => {
  return <SignatureStatusPage userType={userType} />;
}

export default App