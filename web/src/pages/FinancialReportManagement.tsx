import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialReports, createFinancialReport, updateFinancialReport, deleteFinancialReport, submitFinancialReport, approveFinancialReport, getReceiptsForFinancialReport } from '../services/financialReports';
import { FinancialReport, FinancialReportFormData, Receipt } from '../types';
import './FinancialReportManagement.css';

const FinancialReportManagement: React.FC = () => {
  const { user } = useAuth();
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFinancialReport, setEditingFinancialReport] = useState<FinancialReport | null>(null);
  const [formData, setFormData] = useState<FinancialReportFormData>({
    budget_id: '',
    title: '',
    description: '',
    report_date: new Date().toISOString().split('T')[0],
    total_spent: 0,
    variance: 0
  });

  // Fetch financial reports
  useEffect(() => {
    const fetchFinancialReports = async () => {
      try {
        setLoading(true);
        const data = await getFinancialReports();
        setFinancialReports(data);
      } catch (err) {
        setError('Failed to fetch financial reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialReports();
  }, []);

  // Fetch receipts for a financial report
  const fetchReceiptsForReport = async (reportId: string) => {
    try {
      const reportReceipts = await getReceiptsForFinancialReport(reportId);
      setReceipts(prev => ({
        ...prev,
        [reportId]: reportReceipts
      }));
    } catch (err) {
      console.error('Failed to fetch receipts for report:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_spent' || name === 'variance' ? Number(value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFinancialReport) {
        // Update existing financial report
        const updatedFinancialReport = await updateFinancialReport(editingFinancialReport.id, formData);
        setFinancialReports(prev => 
          prev.map(r => r.id === editingFinancialReport.id ? updatedFinancialReport : r)
        );
      } else {
        // Create new financial report
        const newFinancialReport = await createFinancialReport(formData);
        setFinancialReports(prev => [...prev, newFinancialReport]);
      }
      
      // Reset form
      setFormData({
        budget_id: '',
        title: '',
        description: '',
        report_date: new Date().toISOString().split('T')[0],
        total_spent: 0,
        variance: 0
      });
      setShowForm(false);
      setEditingFinancialReport(null);
    } catch (err) {
      setError('Failed to save financial report');
      console.error(err);
    }
  };

  // Handle edit financial report
  const handleEdit = (financialReport: FinancialReport) => {
    setEditingFinancialReport(financialReport);
    setFormData({
      budget_id: financialReport.budget_id,
      title: financialReport.title,
      description: financialReport.description,
      report_date: financialReport.report_date.split('T')[0],
      total_spent: financialReport.total_spent,
      variance: financialReport.variance
    });
    setShowForm(true);
  };

  // Handle delete financial report
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this financial report?')) {
      return;
    }
    
    try {
      await deleteFinancialReport(id);
      setFinancialReports(prev => prev.filter(r => r.id !== id));
      // Remove receipts for this report
      setReceipts(prev => {
        const newReceipts = { ...prev };
        delete newReceipts[id];
        return newReceipts;
      });
    } catch (err) {
      setError('Failed to delete financial report');
      console.error(err);
    }
  };

  // Handle submit financial report
  const handleSubmitReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to submit this financial report?')) {
      return;
    }
    
    try {
      const submittedFinancialReport = await submitFinancialReport(id);
      setFinancialReports(prev => 
        prev.map(r => r.id === id ? submittedFinancialReport : r)
      );
    } catch (err) {
      setError('Failed to submit financial report');
      console.error(err);
    }
  };

  // Handle approve financial report
  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this financial report?')) {
      return;
    }
    
    try {
      const approvedFinancialReport = await approveFinancialReport(id);
      setFinancialReports(prev => 
        prev.map(r => r.id === id ? approvedFinancialReport : r)
      );
    } catch (err) {
      setError('Failed to approve financial report');
      console.error(err);
    }
  };

  // Handle view receipts
  const handleViewReceipts = async (id: string) => {
    // Fetch receipts if not already loaded
    if (!receipts[id]) {
      await fetchReceiptsForReport(id);
    }
    
    // Display receipts in a modal or separate page
    console.log('Receipts for report', id, receipts[id]);
    alert(`Viewing receipts for report ${id}. Check console for details.`);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingFinancialReport(null);
    setFormData({
      budget_id: '',
      title: '',
      description: '',
      report_date: new Date().toISOString().split('T')[0],
      total_spent: 0,
      variance: 0
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="financial-report-management">Loading...</div>;
  }

  return (
    <div className="financial-report-management">
      <div className="header">
        <h1>Financial Report Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Create Financial Report
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingFinancialReport ? 'Edit Financial Report' : 'Create Financial Report'}</h2>
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

            <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="total_spent">Total Spent</label>
                <input
                  type="number"
                  id="total_spent"
                  name="total_spent"
                  value={formData.total_spent}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="variance">Variance</label>
                <input
                  type="number"
                  id="variance"
                  name="variance"
                  value={formData.variance}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingFinancialReport ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="financial-reports-list">
        <h2>Financial Reports</h2>
        {financialReports.length === 0 ? (
          <p>No financial reports found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget ID</th>
                <th>Report Date</th>
                <th>Total Spent</th>
                <th>Variance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {financialReports.map(financialReport => (
                <tr key={financialReport.id}>
                  <td>{financialReport.title}</td>
                  <td>{financialReport.budget_id.substring(0, 8)}...</td>
                  <td>{formatDate(financialReport.report_date)}</td>
                  <td>{formatCurrency(financialReport.total_spent)}</td>
                  <td>{formatCurrency(financialReport.variance)}</td>
                  <td>
                    <span className={`status-badge status-${financialReport.status}`}>
                      {financialReport.status}
                    </span>
                  </td>
                  <td>
                    {financialReport.status === 'draft' && (
                      <>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(financialReport)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSubmitReport(financialReport.id)}
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {financialReport.status === 'submitted' && user?.role === 'accountant' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleApprove(financialReport.id)}
                      >
                        Approve
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleViewReceipts(financialReport.id)}
                    >
                      View Receipts
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(financialReport.id)}
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

export default FinancialReportManagement;