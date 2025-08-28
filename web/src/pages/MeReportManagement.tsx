import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMeReports, createMeReport, updateMeReport, deleteMeReport, submitMeReport, approveMeReport } from '../services/meReports';
import { MeReport, MeReportFormData } from '../types';
import './MeReportManagement.css';

const MeReportManagement: React.FC = () => {
  const { user } = useAuth();
  const [meReports, setMeReports] = useState<MeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeReport, setEditingMeReport] = useState<MeReport | null>(null);
  const [formData, setFormData] = useState<MeReportFormData>({
    budget_id: '',
    title: '',
    description: '',
    report_date: new Date().toISOString().split('T')[0]
  });

  // Fetch ME reports
  useEffect(() => {
    const fetchMeReports = async () => {
      try {
        setLoading(true);
        const data = await getMeReports();
        setMeReports(data);
      } catch (err) {
        setError('Failed to fetch ME reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeReports();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMeReport) {
        // Update existing ME report
        const updatedMeReport = await updateMeReport(editingMeReport.id, formData);
        setMeReports(prev => 
          prev.map(r => r.id === editingMeReport.id ? updatedMeReport : r)
        );
      } else {
        // Create new ME report
        const newMeReport = await createMeReport(formData);
        setMeReports(prev => [...prev, newMeReport]);
      }
      
      // Reset form
      setFormData({
        budget_id: '',
        title: '',
        description: '',
        report_date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingMeReport(null);
    } catch (err) {
      setError('Failed to save ME report');
      console.error(err);
    }
  };

  // Handle edit ME report
  const handleEdit = (meReport: MeReport) => {
    setEditingMeReport(meReport);
    setFormData({
      budget_id: meReport.budget_id,
      title: meReport.title,
      description: meReport.description,
      report_date: meReport.report_date.split('T')[0]
    });
    setShowForm(true);
  };

  // Handle delete ME report
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ME report?')) {
      return;
    }
    
    try {
      await deleteMeReport(id);
      setMeReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete ME report');
      console.error(err);
    }
  };

  // Handle submit ME report
  const handleSubmitReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to submit this ME report?')) {
      return;
    }
    
    try {
      const submittedMeReport = await submitMeReport(id);
      setMeReports(prev => 
        prev.map(r => r.id === id ? submittedMeReport : r)
      );
    } catch (err) {
      setError('Failed to submit ME report');
      console.error(err);
    }
  };

  // Handle approve ME report
  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this ME report?')) {
      return;
    }
    
    try {
      const approvedMeReport = await approveMeReport(id);
      setMeReports(prev => 
        prev.map(r => r.id === id ? approvedMeReport : r)
      );
    } catch (err) {
      setError('Failed to approve ME report');
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingMeReport(null);
    setFormData({
      budget_id: '',
      title: '',
      description: '',
      report_date: new Date().toISOString().split('T')[0]
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="me-report-management">Loading...</div>;
  }

  return (
    <div className="me-report-management">
      <div className="header">
        <h1>ME Report Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Create ME Report
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingMeReport ? 'Edit ME Report' : 'Create ME Report'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="budget_id">Budget ID</label>
              <input
                type="text"
                id="budget_id"
                name="budget_id"
                value={formData.budget_id}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="report_date">Report Date</label>
              <input
                type="date"
                id="report_date"
                name="report_date"
                value={formData.report_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingMeReport ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="me-reports-list">
        <h2>ME Reports</h2>
        {meReports.length === 0 ? (
          <p>No ME reports found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget ID</th>
                <th>Report Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meReports.map(meReport => (
                <tr key={meReport.id}>
                  <td>{meReport.title}</td>
                  <td>{meReport.budget_id.substring(0, 8)}...</td>
                  <td>{formatDate(meReport.report_date)}</td>
                  <td>
                    <span className={`status-badge status-${meReport.status}`}>
                      {meReport.status}
                    </span>
                  </td>
                  <td>
                    {meReport.status === 'draft' && (
                      <>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(meReport)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSubmitReport(meReport.id)}
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {meReport.status === 'submitted' && user?.role === 'm&e_officer' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(meReport.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(meReport.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MeReportManagement;