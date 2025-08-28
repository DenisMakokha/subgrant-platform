import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { formatRole, formatOrgStatus, formatComplianceStatus } from '../utils/format';
import './Profile.css';

interface ProfileProps {
  user: any;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Update user profile
      await userApi.update(user.id, formData);
      
      // Update successful
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save Changes
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-item">
                <span className="label">Name:</span>
                <span className="value">{user.firstName} {user.lastName}</span>
              </div>
              <div className="profile-item">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="profile-item">
                <span className="label">Phone:</span>
                <span className="value">{user.phone || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Role:</span>
                <span className="value">{formatRole(user.role)}</span>
              </div>
            </div>
            
            {user.organization && (
              <div className="profile-section">
                <h2>Organization Information</h2>
                <div className="profile-item">
                  <span className="label">Name:</span>
                  <span className="value">{user.organization.name}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Legal Name:</span>
                  <span className="value">{user.organization.legalName || 'Not provided'}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Registration Number:</span>
                  <span className="value">{user.organization.registrationNumber || 'Not provided'}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Tax ID:</span>
                  <span className="value">{user.organization.taxId || 'Not provided'}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Status:</span>
                  <span className="value">{formatOrgStatus(user.organization.status)}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Compliance Status:</span>
                  <span className="value">{formatComplianceStatus(user.organization.complianceStatus)}</span>
                </div>
              </div>
            )}
            
            <div className="profile-actions">
              <button 
                className="edit-button"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;