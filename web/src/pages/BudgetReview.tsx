import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import './BudgetReview.css';

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

const BudgetReview: React.FC = () => {
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
      let budgetsResponse;
      
      if (user?.role === 'partner_user') {
        budgetsResponse = await api.budgets.getByOrganization(user.organization?.id || '');
      } else {
        budgetsResponse = await api.budgets.getAll();
      }
      
      setBudgets(budgetsResponse.data || budgetsResponse);
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
      setSuccess('Comment added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await api.reviewComments.resolve(commentId);
      
      // Update the comment in the list
      const updatedComments = comments.map(comment => 
        comment.id === commentId ? { ...comment, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id || null } : comment
      );
      
      setComments(updatedComments);
      setSuccess('Comment resolved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to resolve comment');
      console.error('Error resolving comment:', err);
    }
  };

  if (loading) {
    return <div className="budget-review">Loading budgets...</div>;
  }

  return (
    <div className="budget-review">
      <div className="page-header">
        <h1>Budget Review</h1>
        <p>Review and manage your budget submissions</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="review-content">
        {!selectedBudget ? (
          <div className="budget-list">
            <h2>Your Budgets</h2>
            {budgets.length === 0 ? (
              <p>No budgets found.</p>
            ) : (
              <div className="budget-cards">
                {budgets.map(budget => (
                  <div key={budget.id} className="budget-card" onClick={() => handleBudgetSelect(budget)}>
                    <h3>{budget.title}</h3>
                    <p className="organization">{budget.organization?.name || 'Organization'}</p>
                    <p className="project">{budget.project?.name || 'Project'}</p>
                    <div className="budget-details">
                      <span className="amount">{formatCurrency(budget.total_amount, budget.currency)}</span>
                      <span className={`status ${budget.status}`}>{budget.status.replace('_', ' ')}</span>
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
                <p><strong>Status:</strong> <span className={`status ${selectedBudget.status}`}>{selectedBudget.status.replace('_', ' ')}</span></p>
                <p><strong>Submitted:</strong> {selectedBudget.submitted_at ? formatDate(selectedBudget.submitted_at) : 'N/A'}</p>
              </div>
            </div>
            
            <div className="comments-section">
              <h3>Review Comments</h3>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className={`comment ${comment.is_resolved ? 'resolved' : ''}`}>
                      <div className="comment-header">
                        <span className="author">
                          {comment.author?.first_name} {comment.author?.last_name}
                        </span>
                        <span className="date">{formatDate(comment.created_at)}</span>
                        {!comment.is_resolved && (
                          <button 
                            className="resolve-button" 
                            onClick={() => handleResolveComment(comment.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                      <div className="comment-content">
                        <p>{comment.content}</p>
                      </div>
                      {comment.is_resolved && (
                        <div className="resolved-info">
                          <span>Resolved by {comment.resolved_by || 'Unknown'} on {comment.resolved_at ? formatDate(comment.resolved_at) : 'N/A'}</span>
                        </div>
                      )}
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
    </div>
  );
};

export default BudgetReview;