import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

// SVG Icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Budget Approval
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Review and approve submitted budgets
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-sm text-blue-100 font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="glass-card p-4 border-l-4 border-green-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
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