import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-actions">
        <div className="action-card">
          <h2>Role & Dashboard Management</h2>
          <p>Manage roles and dashboards for the SSOT system.</p>
          <Link to="/admin/wizard" className="btn btn-primary">
            Launch Wizard
          </Link>
        </div>
        
        <div className="action-card">
          <h2>Capability Catalog</h2>
          <p>View and manage the capability catalog.</p>
          <button className="btn btn-secondary" disabled>
            View Catalog
          </button>
        </div>
        
        <div className="action-card">
          <h2>Data Key Registry</h2>
          <p>View and manage the data key registry.</p>
          <button className="btn btn-secondary" disabled>
            View Registry
          </button>
        </div>
        
        <div className="action-card">
          <h2>Approval Policies</h2>
          <p>Manage approval policies and providers.</p>
          <button className="btn btn-secondary" disabled>
            Manage Policies
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;