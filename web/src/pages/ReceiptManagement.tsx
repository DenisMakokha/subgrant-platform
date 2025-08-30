import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getReceipts, createReceipt, updateReceipt, deleteReceipt } from '../services/receipts';
import { Receipt, ReceiptFormData } from '../types';
import './ReceiptManagement.css';

const ReceiptManagement: React.FC = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [formData, setFormData] = useState<ReceiptFormData>({
    financial_report_id: '',
    budget_line_id: '',
    amount: 0,
    description: '',
    document_uri: '',
    document_name: '',
    mime_type: ''
  });

  // Fetch receipts
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const data = await getReceipts();
        setReceipts(data);
      } catch (err) {
        setError('Failed to fetch receipts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        document_name: file.name,
        mime_type: file.type,
        document_uri: URL.createObjectURL(file)
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingReceipt) {
        // Update existing receipt
        const updatedReceipt = await updateReceipt(editingReceipt.id, formData);
        setReceipts(prev => 
          prev.map(r => r.id === editingReceipt.id ? updatedReceipt : r)
        );
      } else {
        // Create new receipt
        const newReceipt = await createReceipt(formData);
        setReceipts(prev => [...prev, newReceipt]);
      }
      
      // Reset form
      setFormData({
        financial_report_id: '',
        budget_line_id: '',
        amount: 0,
        description: '',
        document_uri: '',
        document_name: '',
        mime_type: ''
      });
      setShowForm(false);
      setEditingReceipt(null);
    } catch (err) {
      setError('Failed to save receipt');
      console.error(err);
    }
  };

  // Handle edit receipt
  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setFormData({
      financial_report_id: receipt.financial_report_id,
      budget_line_id: receipt.budget_line_id || '',
      amount: receipt.amount,
      description: receipt.description,
      document_uri: receipt.document_uri,
      document_name: receipt.document_name,
      mime_type: receipt.mime_type
    });
    setShowForm(true);
  };

  // Handle delete receipt
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      return;
    }
    
    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete receipt');
      console.error(err);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingReceipt(null);
    setFormData({
      financial_report_id: '',
      budget_line_id: '',
      amount: 0,
      description: '',
      document_uri: '',
      document_name: '',
      mime_type: ''
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
    return <div className="receipt-management">Loading...</div>;
  }

  return (
    <div className="receipt-management">
      <div className="header">
        <h1>Receipt Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          Upload Receipt
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h2>{editingReceipt ? 'Edit Receipt' : 'Upload Receipt'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="financial_report_id">Financial Report ID</label>
              <input
                type="text"
                id="financial_report_id"
                name="financial_report_id"
                value={formData.financial_report_id}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget_line_id">Budget Line ID (Optional)</label>
              <input
                type="text"
                id="budget_line_id"
                name="budget_line_id"
                value={formData.budget_line_id}
                onChange={handleInputChange}
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
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="document">Document</label>
              <input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required={!editingReceipt}
              />
              {formData.document_name && (
                <div className="file-info">
                  Selected file: {formData.document_name}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingReceipt ? 'Update' : 'Upload'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="receipts-list">
        <h2>Receipts</h2>
        {receipts.length === 0 ? (
          <p>No receipts found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Financial Report ID</th>
                <th>Budget Line ID</th>
                <th>Amount</th>
                <th>Document</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(receipt => (
                <tr key={receipt.id}>
                  <td>{receipt.description}</td>
                  <td>{receipt.financial_report_id.substring(0, 8)}...</td>
                  <td>{receipt.budget_line_id ? receipt.budget_line_id.substring(0, 8) + '...' : 'N/A'}</td>
                  <td>{formatCurrency(receipt.amount, receipt.currency)}</td>
                  <td>
                    <a href={receipt.document_uri} target="_blank" rel="noopener noreferrer">
                      {receipt.document_name}
                    </a>
                  </td>
                  <td>{formatDate(receipt.created_at)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(receipt)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(receipt.id)}
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

export default ReceiptManagement;