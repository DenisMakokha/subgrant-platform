import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface RoleDefinition {
  id: string;
  label: string;
  capabilities: string[];
  scopes: Record<string, string>;
  dashboards: string[];
}

interface DashboardDefinition {
  id: string;
  label: string;
  version: number;
  menus: any[];
  pages: any[];
}

const AdminWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [roleDef, setRoleDef] = useState<RoleDefinition>({
    id: '',
    label: '',
    capabilities: [],
    scopes: {},
    dashboards: []
  });
  const [dashboardDef, setDashboardDef] = useState<DashboardDefinition>({
    id: '',
    label: '',
    version: 1,
    menus: [],
    pages: []
  });

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real implementation, this would call the admin API
      await api.post('/admin/roles', roleDef);
      setStep(2);
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleDashboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real implementation, this would call the admin API
      await api.post('/admin/dashboards', dashboardDef);
      navigate('/admin');
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  return (
    <div className="wizard-container">
      <h1>Admin Wizard</h1>
      
      {step === 1 && (
        <div className="role-definition-step">
          <h2>Role Definition</h2>
          <form onSubmit={handleRoleSubmit}>
            <div>
              <label htmlFor="roleId">Role ID:</label>
              <input
                type="text"
                id="roleId"
                value={roleDef.id}
                onChange={(e) => setRoleDef({...roleDef, id: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label htmlFor="roleLabel">Role Label:</label>
              <input
                type="text"
                id="roleLabel"
                value={roleDef.label}
                onChange={(e) => setRoleDef({...roleDef, label: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label>Capabilities (comma separated):</label>
              <input
                type="text"
                value={roleDef.capabilities.join(', ')}
                onChange={(e) => setRoleDef({...roleDef, capabilities: e.target.value.split(',').map(cap => cap.trim())})}
              />
            </div>
            
            <div>
              <label>Scopes (JSON):</label>
              <textarea
                value={JSON.stringify(roleDef.scopes, null, 2)}
                onChange={(e) => setRoleDef({...roleDef, scopes: JSON.parse(e.target.value)})}
                rows={4}
              />
            </div>
            
            <div>
              <label>Dashboards (comma separated):</label>
              <input
                type="text"
                value={roleDef.dashboards.join(', ')}
                onChange={(e) => setRoleDef({...roleDef, dashboards: e.target.value.split(',').map(db => db.trim())})}
              />
            </div>
            
            <button type="submit">Next: Define Dashboard</button>
          </form>
        </div>
      )}
      
      {step === 2 && (
        <div className="dashboard-definition-step">
          <h2>Dashboard Definition</h2>
          <form onSubmit={handleDashboardSubmit}>
            <div>
              <label htmlFor="dashboardId">Dashboard ID:</label>
              <input
                type="text"
                id="dashboardId"
                value={dashboardDef.id}
                onChange={(e) => setDashboardDef({...dashboardDef, id: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label htmlFor="dashboardLabel">Dashboard Label:</label>
              <input
                type="text"
                id="dashboardLabel"
                value={dashboardDef.label}
                onChange={(e) => setDashboardDef({...dashboardDef, label: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label>Version:</label>
              <input
                type="number"
                value={dashboardDef.version}
                onChange={(e) => setDashboardDef({...dashboardDef, version: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <label>Menus (JSON):</label>
              <textarea
                value={JSON.stringify(dashboardDef.menus, null, 2)}
                onChange={(e) => setDashboardDef({...dashboardDef, menus: JSON.parse(e.target.value)})}
                rows={6}
              />
            </div>
            
            <div>
              <label>Pages (JSON):</label>
              <textarea
                value={JSON.stringify(dashboardDef.pages, null, 2)}
                onChange={(e) => setDashboardDef({...dashboardDef, pages: JSON.parse(e.target.value)})}
                rows={6}
              />
            </div>
            
            <button type="submit">Create Dashboard</button>
            <button type="button" onClick={() => setStep(1)}>Back to Role</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminWizard;