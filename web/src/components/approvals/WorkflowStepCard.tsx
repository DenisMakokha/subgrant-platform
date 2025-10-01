import React from 'react';
import { ApprovalStep } from '../../services/approvalChainApi';

interface WorkflowStepCardProps {
  step: Partial<ApprovalStep>;
  index: number;
  totalSteps: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isDragging?: boolean;
}

const WorkflowStepCard: React.FC<WorkflowStepCardProps> = ({
  step,
  index,
  totalSteps,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isDragging = false
}) => {
  const roles = [
    { value: 'grants_manager', label: 'Grants Manager' },
    { value: 'finance_manager', label: 'Finance Manager' },
    { value: 'chief_operations_officer', label: 'COO' },
    { value: 'ceo', label: 'CEO' },
    { value: 'program_manager', label: 'Program Manager' },
    { value: 'compliance_officer', label: 'Compliance Officer' }
  ];

  const approvalTypes = [
    { value: 'sequential', label: 'Sequential (one at a time)' },
    { value: 'parallel', label: 'Parallel (all at once)' },
    { value: 'any', label: 'Any (first to respond)' }
  ];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 ${
      isDragging ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'
    } p-6 transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
            {index + 1}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Step {index + 1}
            </h3>
            <p className="text-xs text-slate-500">
              {step.approval_type === 'sequential' ? 'Sequential' : 
               step.approval_type === 'parallel' ? 'Parallel' : 'Any Approver'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Move Up */}
          {index > 0 && (
            <button
              onClick={() => onMoveUp(index)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Move up"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}

          {/* Move Down */}
          {index < totalSteps - 1 && (
            <button
              onClick={() => onMoveDown(index)}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Move down"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Drag Handle */}
          <div className="p-2 text-slate-400 cursor-move" title="Drag to reorder">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Remove */}
          {totalSteps > 1 && (
            <button
              onClick={() => onRemove(index)}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
              title="Remove step"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Step Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Step Name *
          </label>
          <input
            type="text"
            value={step.step_name || ''}
            onChange={(e) => onUpdate(index, 'step_name', e.target.value)}
            placeholder="e.g., Manager Approval"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        {/* Approver Role */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Approver Role *
          </label>
          <select
            value={step.approver_role_id || ''}
            onChange={(e) => onUpdate(index, 'approver_role_id', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select role...</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        {/* Approval Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Approval Type
          </label>
          <select
            value={step.approval_type || 'sequential'}
            onChange={(e) => onUpdate(index, 'approval_type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            {approvalTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Required Approvers (for parallel) */}
        {step.approval_type === 'parallel' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Required Approvers
            </label>
            <input
              type="number"
              min="1"
              value={step.required_approvers || 1}
              onChange={(e) => onUpdate(index, 'required_approvers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Number of approvers required to proceed
            </p>
          </div>
        )}

        {/* Escalation Hours */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Escalation Time (hours)
          </label>
          <input
            type="number"
            min="1"
            value={step.escalation_hours || 24}
            onChange={(e) => onUpdate(index, 'escalation_hours', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs text-slate-500 mt-1">
            Auto-escalate if not approved within this time
          </p>
        </div>
      </div>

      {/* Step Preview */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {step.step_name || 'Unnamed step'} → 
            {step.approver_role_id ? ` ${roles.find(r => r.value === step.approver_role_id)?.label}` : ' No role selected'} →
            Escalates in {step.escalation_hours || 24}h
          </span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepCard;
