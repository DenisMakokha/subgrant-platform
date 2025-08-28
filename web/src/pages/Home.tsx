import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to the Sub-Grant Management Platform</h1>
        <p>Manage your sub-grant programs efficiently and effectively</p>
        <div className="cta-buttons">
          <button className="cta-button primary">Get Started</button>
          <button className="cta-button secondary">Learn More</button>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <h3>Partner Onboarding</h3>
          <p>Streamline the registration and verification of partner organizations</p>
        </div>
        <div className="feature">
          <h3>Budget Management</h3>
          <p>Create and manage detailed budgets with multi-tier approval workflows</p>
        </div>
        <div className="feature">
          <h3>Digital Contracts</h3>
          <p>Automate contract generation and signing with DocuSign integration</p>
        </div>
        <div className="feature">
          <h3>Disbursement Tracking</h3>
          <p>Monitor fund transfers and reconcile with Xero accounting system</p>
        </div>
      </div>
    </div>
  );
};

export default Home;