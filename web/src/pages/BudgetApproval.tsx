import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import './BudgetApproval.css';

interface Budget {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description: string;
  total_amount: number;
  currency: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  organization?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

interface ReviewComment {
  id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

const BudgetApproval: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.budgets.getAll();
      const pendingBudgets = (response.data || response).filter((budget: Budget) => budget.status === 'submitted');
      setBudgets(pendingBudgets);
      setError(null);
    } catch (err) {
      setError('Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (budgetId: string) => {
    try {
      const response = await api.reviewComments.getByEntity('budget', budgetId);
      setComments(response.data || response);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleBudgetSelect = async (budget: Budget) => {
    setSelectedBudget(budget);
    await fetchComments(budget.id);
  };

  const handleApprove = async () => {
    if (!selectedBudget) return;
    
    try {
      await api.budgets.approve(selectedBudget.id);
      setSuccess('Budget approved successfully');
      fetchBudgets();
      setSelectedBudget(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to approve budget');
      console.error('Error approving budget:', err);
    }
  };

  const handleRequestRevisions = async () => {
    if (!selectedBudget || !newComment) return;
    
    try {
      await api.budgets.requestRevisions(selectedBudget.id, newComment);
      
      // Add comment to the list
      const commentResponse = await api.reviewComments.create({
        entity_type: 'budget',
        entity_id: selectedBudget.id,
        content: newComment,
        author_id: user?.id
      });
      
      setComments([...comments, commentResponse.data || commentResponse]);
      setNewComment('');
      setSuccess('Revision request submitted successfully');
      fetchBudgets();
      setSelectedBudget(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to request revisions');
      console.error('Error requesting revisions:', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedBudget || !newComment) return;
    
    try {
      const response = await api.reviewComments.create({
        entity_type: 'budget',
        entity_id: selectedBudget.id,
        content: newComment,
        author_id: user?.id
      });
      
      setComments([...comments, response.data || response]);
      setNewComment('');
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  if (loading) {
    return <div className="budget-approval">Loading budgets...</div>;
  }

  return (
    <div className="budget-approval">
      <div className="page-header">
        <h1>Budget Approval</h1>
        <p>Review and approve submitted budgets</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="approval-content">
        {!selectedBudget ? (
          <div className="budget-list">
            <h2>Pending Budgets for Approval</h2>
            {budgets.length === 0 ? (
              <p>No budgets pending approval.</p>
            ) : (
              <div className="budget-cards">
                {budgets.map(budget => (
                  <div key={budget.id} className="budget-card" onClick={() => handleBudgetSelect(budget)}>
                    <h3>{budget.title}</h3>
                    <p className="organization">{budget.organization?.name || 'Organization'}</p>
                    <p className="project">{budget.project?.name || 'Project'}</p>
                    <div className="budget-details">
                      <span className="amount">{formatCurrency(budget.total_amount, budget.currency)}</span>
                      <span className="date">Submitted: {budget.submitted_at ? formatDate(budget.submitted_at) : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="budget-detail">
            <div className="detail-header">
              <button className="back-button" onClick={() => setSelectedBudget(null)}>
                &larr; Back to List
              </button>
              <h2>{selectedBudget.title}</h2>
              <div className="budget-info">
                <p><strong>Organization:</strong> {selectedBudget.organization?.name || 'N/A'}</p>
                <p><strong>Project:</strong> {selectedBudget.project?.name || 'N/A'}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedBudget.total_amount, selectedBudget.currency)}</p>
                <p><strong>Submitted:</strong> {selectedBudget.submitted_at ? formatDate(selectedBudget.submitted_at) : 'N/A'}</p>
              </div>
            </div>
            
            <div className="approval-actions">
              <button className="btn btn-success" onClick={handleApprove}>
                Approve Budget
              </button>
              <button className="btn btn-warning" onClick={() => document.getElementById('revision-modal')?.classList.add('show')}>
                Request Revisions
              </button>
            </div>
            
            <div className="comments-section">
              <h3>Review Comments</h3>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="author">
                          {comment.author?.first_name} {comment.author?.last_name}
                        </span>
                        <span className="date">{formatDate(comment.created_at)}</span>
                      </div>
                      <div className="comment-content">
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="add-comment">
                <h4>Add Comment</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your review comments here..."
                  rows={4}
                />
                <button className="btn btn-primary" onClick={handleAddComment}>
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Revision Request Modal */}
      <div id="revision-modal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Request Revisions</h2>
            <button className="close-button" onClick={() => document.getElementById('revision-modal')?.classList.remove('show')}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <p>Please provide details about the revisions needed for this budget:</p>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Describe the revisions needed..."
              rows={6}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => document.getElementById('revision-modal')?.classList.remove('show')}>
              Cancel
            </button>
            <button className="btn btn-warning" onClick={handleRequestRevisions}>
              Request Revisions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetApproval;