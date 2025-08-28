import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDisbursements, createDisbursement, updateDisbursement, deleteDisbursement } from '../services/disbursements';
import { Disbursement, DisbursementFormData } from '../types/index';
import './DisbursementManagement.css';

const DisbursementManagement: React.FC = () => {
  const { user } = useAuth();
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDisbursement, setEditingDisbursement] = useState<Disbursement | null>(null);
  const [formData, setFormData] = useState<DisbursementFormData>({
    budget_id: '',
    title: '',
    description: '',
    tranche_number: 1,
    amount: 0,
    currency: 'USD',
    planned_date: new Date().toISOString().split('T')[0]
  });

  // Fetch disbursements
  useEffect(() => {
    const fetchDisbursements = async () => {
      try {
        setLoading(true);
        const data = await getDisbursements();
        setDisbursements(data);
      } catch (err) {
        setError('Failed to fetch disbursements');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDisbursements();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tranche_number' || name === 'amount' ? Number(value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDisbursement) {
        // Update existing disbursement
        const updatedDisbursement = await updateDisbursement(editingDisbursement.id, formData);
        setDisbursements(prev => 
          prev.map(d => d.id === editingDisbursement.id ? updatedDisbursement : d)
        );
      } else {
        // Create new disbursement
        const newDisbursement = await createDisbursement(formData);
        setDisbursements(prev => [...prev, newDisbursement]);
      }
      
      // Reset form
      setFormData({
        budget_id: '',
        title: '',
        description: '',
        tranche_number: 1,
        amount: 0,
        currency: 'USD',
        planned_date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingDisbursement(null);
    } catch (err) {
      setError('Failed to save disbursement');
      console.error(err);
    }
  };

  // Handle edit disbursement
  const handleEdit = (disbursement: Disbursement) => {
    setEditingDisbursement(disbursement);
    setFormData({
      budget_id: disbursement.budget_id,
      title: disbursement.title,
      description: disbursement.description,
      tranche_number: disbursement.tranche_number,
      amount: disbursement.amount,
      currency: disbursement.currency,
      planned_date: disbursement.planned_date.split('T')[0]
    });
    setShowForm(true);
  };

  // Handle delete disbursement
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this disbursement?')) {
      return;
    }
    
    try {
      await deleteDisbursement(id);
      setDisbursements(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Failed to delete disbursement');
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingDisbursement(null);
    setFormData({
      budget_id: '',
      title: '',
      description: '',
      tranche_number: 1,
      amount: 0,
      currency: 'USD',
      planned_date: new Date().toISOString().split('T')[0]
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
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
    return <div className="disbursement-management">Loading...</div>;
  }

  return (
    <div className="disbursement-management">
      <div className="header">
        <h1>Disbursement Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Create Disbursement
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingDisbursement ? 'Edit Disbursement' : 'Create Disbursement'}</h2>
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
                <label htmlFor="tranche_number">Tranche Number</label>
                <input
                  type="number"
                  id="tranche_number"
                  name="tranche_number"
                  value={formData.tranche_number}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="KES">KES</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="planned_date">Planned Date</label>
              <input
                type="date"
                id="planned_date"
                name="planned_date"
                value={formData.planned_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingDisbursement ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="disbursements-list">
        <h2>Disbursements</h2>
        {disbursements.length === 0 ? (
          <p>No disbursements found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget ID</th>
                <th>Tranche</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Planned Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disbursements.map(disbursement => (
                <tr key={disbursement.id}>
                  <td>{disbursement.title}</td>
                  <td>{disbursement.budget_id.substring(0, 8)}...</td>
                  <td>{disbursement.tranche_number}</td>
                  <td>{formatCurrency(disbursement.amount, disbursement.currency)}</td>
                  <td>{disbursement.currency}</td>
                  <td>{formatDate(disbursement.planned_date)}</td>
                  <td>
                    <span className={`status-badge status-${disbursement.status}`}>
                      {disbursement.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(disbursement)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(disbursement.id)}
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

export default DisbursementManagement;