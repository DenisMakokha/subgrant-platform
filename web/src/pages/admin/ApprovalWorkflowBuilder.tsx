import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import approvalChainApi, { ApprovalWorkflow, ApprovalStep } from '../../services/approvalChainApi';
import { toast } from 'react-toastify';

const ApprovalWorkflowBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('budget');
  const [steps, setSteps] = useState<Partial<ApprovalStep>[]>([
    {
      step_name: '',
      approver_type: 'role',
      approver_role_id: '',
      approval_type: 'sequential',
      required_approvers: 1,
      escalation_hours: 24
    }
  ]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await approvalChainApi.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    setSteps([...steps, {
      step_name: '',
      approver_type: 'role',
      approver_role_id: '',
      approval_type: 'sequential',
      required_approvers: 1,
      escalation_hours: 24
    }]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    } else {
      toast.error('Workflow must have at least one step');
    }
  };

  const handleStepChange = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !entityType) {
      toast.error('Please fill in workflow name and entity type');
      return;
    }

    if (steps.some(s => !s.step_name || !s.approver_type)) {
      toast.error('Please complete all step details');
      return;
    }

    try {
      if (editingId) {
        await approvalChainApi.updateWorkflow(editingId, { name, description, steps });
        toast.success('Workflow updated successfully');
      } else {
        await approvalChainApi.createWorkflow({ name, description, entity_type: entityType, steps });
        toast.success('Workflow created successfully');
      }
      
      resetForm();
      fetchWorkflows();
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast.error(error.message || 'Failed to save workflow');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const workflow = await approvalChainApi.getWorkflowById(id);
      setEditingId(id);
      setName(workflow.name);
      setDescription(workflow.description || '');
      setEntityType(workflow.entity_type);
      setSteps(workflow.steps.map(s => ({
        step_name: s.step_name,
        approver_type: s.approver_type,
        approver_role_id: s.approver_role_id,
        approver_user_id: s.approver_user_id,
        approval_type: s.approval_type,
        required_approvers: s.required_approvers,
        escalation_hours: s.escalation_hours,
        escalation_to: s.escalation_to
      })));
      setShowForm(true);
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast.error('Failed to load workflow details');
    }
  };

  const handleDelete = async (id: string, workflowName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${workflowName}"?`)) return;
    
    try {
      await approvalChainApi.deleteWorkflow(id);
      toast.success('Workflow deleted successfully');
      fetchWorkflows();
    } catch (error: any) {
      console.error('Error deleting workflow:', error);
      toast.error(error.message || 'Failed to delete workflow');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await approvalChainApi.updateWorkflow(id, { is_active: !currentStatus });
      toast.success(`Workflow ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow status');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setEntityType('budget');
    setSteps([{
      step_name: '',
      approver_type: 'role',
      approver_role_id: '',
      approval_type: 'sequential',
      required_approvers: 1,
      escalation_hours: 24
    }]);
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'budget': return '💰';
      case 'fund_request': return '💵';
      case 'contract': return '📄';
      case 'report': return '📊';
      default: return '📋';
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'budget': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'fund_request': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'contract': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'report': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workflows</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Configure approval workflows for different entity types</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors"
        >
          {showForm ? '← Back to List' : '+ New Workflow'}
        </button>
      </div>

      {/* Workflow Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingId ? 'Edit Workflow' : 'Create New Workflow'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workflow Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Budget Approval - Standard"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entity Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    disabled={!!editingId}
                    required
                  >
                    <option value="budget">Budget</option>
                    <option value="fund_request">Fund Request</option>
                    <option value="contract">Contract</option>
                    <option value="report">Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the purpose of this workflow..."
                />
              </div>

              {/* Approval Steps */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Approval Flow
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    + Add Approval Step
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Step 0: Submitter/Initiator */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        0
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Submitter / Initiator
                      </h4>
                      <span className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        Auto
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                      The user who creates and submits the request for approval
                    </p>
                  </div>

                  {/* Approval Steps */}
                  {steps.map((step, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Approval Step {index + 1}
                          </h4>
                        </div>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(index)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Step Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={step.step_name}
                            onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="e.g., Accountant Review"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Approver Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={step.approver_type}
                            onChange={(e) => handleStepChange(index, 'approver_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          >
                            <option value="role">Role</option>
                            <option value="user">Specific User</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {step.approver_type === 'role' ? 'Role ID' : 'User ID'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={step.approver_type === 'role' ? step.approver_role_id : step.approver_user_id}
                            onChange={(e) => handleStepChange(index, step.approver_type === 'role' ? 'approver_role_id' : 'approver_user_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder={step.approver_type === 'role' ? 'e.g., accountant' : 'User UUID'}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Escalation (hours)
                          </label>
                          <input
                            type="number"
                            value={step.escalation_hours || ''}
                            onChange={(e) => handleStepChange(index, 'escalation_hours', parseInt(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="24"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
                >
                  {editingId ? 'Update Workflow' : 'Create Workflow'}
                </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflows List */}
      {!showForm && (
        <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading workflows...</p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No workflows yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first approval workflow to get started</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
                >
                  Create Workflow
                </button>
              </div>
            ) : (
              workflows.map((workflow) => (
                <div key={workflow.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getEntityTypeIcon(workflow.entity_type)}</span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{workflow.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(workflow.entity_type)}`}>
                          {workflow.entity_type.replace('_', ' ')}
                        </span>
                        {workflow.is_active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      {workflow.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{workflow.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Submitter → {workflow.step_count} approval step{workflow.step_count !== 1 ? 's' : ''}
                        </span>
                        <span>Created by {workflow.created_by_name || 'System'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          workflow.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {workflow.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEdit(workflow.id)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id, workflow.name)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflowBuilder;
