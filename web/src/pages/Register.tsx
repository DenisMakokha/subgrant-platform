import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { saveToken } from '../utils/auth';
import './Register.css';

interface RegisterProps {
  onRegister?: (user: any) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Prepare user data
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      };
      
      // Call the register API
      const response = await authApi.register(userData);
      
      // Registration successful - show verification message
      setRegistrationSuccess(true);
      setRegisteredEmail(email);
      
      // Call the onRegister callback with user data if provided
      if (onRegister) {
        onRegister(response.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await authApi.resendVerification(registeredEmail);
      setError('');
      // Show success message or update UI as needed
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h2>Check Your Email</h2>
          <div className="success-message">
            <p>Thanks for signing up! We've sent a verification email to:</p>
            <p><strong>{registeredEmail}</strong></p>
            <p>Please check your email and click the verification link to continue your onboarding.</p>
          </div>
          <div className="verification-actions">
            <button 
              onClick={handleResendVerification} 
              className="resend-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button 
              onClick={() => setRegisteredEmail('')} 
              className="change-email-button"
            >
              Change Email Address
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="register-footer">
            <a href="/login">Back to Login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create an Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="button-spacing"></div>
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="register-footer">
          <a href="/login">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;