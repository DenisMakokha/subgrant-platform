import React from 'react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/organizations">Organizations</a></li>
          <li><a href="/users">Users</a></li>
          <li><a href="/projects">Projects</a></li>
          <li><a href="/budgets">Budgets</a></li>
          <li><a href="/contracts">Contracts</a></li>
          <li><a href="/disbursements">Disbursements</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/documents">Documents</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;