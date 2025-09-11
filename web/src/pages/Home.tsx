import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Zizi Afrique Foundation Grants Management Portal</h1>
        <p>Manage your grant programs efficiently and effectively</p>
        <div className="cta-buttons">
          <button className="cta-button primary">Get Started</button>
          <a href="https://ziziafrique.org/" target="_blank" rel="noopener noreferrer" className="cta-button secondary">Learn More</a>
        </div>
      </div>
      
      <div className="features">
        <div className="features-container">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"/>
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"/>
                </svg>
              </div>
              <h3>Partner Onboarding</h3>
              <p>Streamline the registration and verification of partner organizations</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💰</div>
              <h3>Budget Management</h3>
              <p>Create and manage detailed budgets with multi-tier approval workflows</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📄</div>
              <h3>Contract Management</h3>
              <p>Automate contract generation and signing with DocuSign integration</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Reporting</h3>
              <p>Monitor fund transfers and reconcile with Xero accounting system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;