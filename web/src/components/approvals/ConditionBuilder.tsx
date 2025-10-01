import React, { useState } from 'react';

export interface ApprovalCondition {
  id: string;
  type: 'amount' | 'project_type' | 'time' | 'organization' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'contains' | 'not_contains';
  field: string;
  value: string | number;
  action: 'add_step' | 'skip_step' | 'change_approver' | 'escalate';
  actionValue?: string;
}

interface ConditionBuilderProps {
  conditions: ApprovalCondition[];
  onChange: (conditions: ApprovalCondition[]) => void;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const conditionTypes = [
    { value: 'amount', label: 'Amount-based', icon: '💰' },
    { value: 'project_type', label: 'Project Type', icon: '📁' },
    { value: 'time', label: 'Time-based', icon: '⏰' },
    { value: 'organization', label: 'Organization', icon: '🏢' },
    { value: 'custom', label: 'Custom Field', icon: '⚙️' }
  ];

  const operators = {
    amount: [
      { value: 'greater_than', label: 'Greater than (>)' },
      { value: 'less_than', label: 'Less than (<)' },
      { value: 'greater_or_equal', label: 'Greater or equal (>=)' },
      { value: 'less_or_equal', label: 'Less or equal (<=)' },
      { value: 'equals', label: 'Equals (=)' }
    ],
    project_type: [
      { value: 'equals', label: 'Is' },
      { value: 'not_equals', label: 'Is not' },
      { value: 'contains', label: 'Contains' }
    ],
    time: [
      { value: 'greater_than', label: 'After' },
      { value: 'less_than', label: 'Before' }
    ],
    organization: [
      { value: 'equals', label: 'Is' },
      { value: 'not_equals', label: 'Is not' }
    ],
    custom: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' }
    ]
  };

  const actions = [
    { value: 'add_step', label: 'Add Approval Step', icon: '➕' },
    { value: 'skip_step', label: 'Skip Step', icon: '⏭️' },
    { value: 'change_approver', label: 'Change Approver', icon: '👤' },
    { value: 'escalate', label: 'Immediate Escalation', icon: '🚨' }
  ];

  const addCondition = () => {
    const newCondition: ApprovalCondition = {
      id: `cond_${Date.now()}`,
      type: 'amount',
      operator: 'greater_than',
      field: 'amount',
      value: 0,
      action: 'add_step'
    };
    onChange([...conditions, newCondition]);
    setShowAddForm(false);
  };

  const updateCondition = (id: string, updates: Partial<ApprovalCondition>) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  const getOperatorsForType = (type: string) => {
    return operators[type as keyof typeof operators] || operators.custom;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Conditional Routing
          </h3>
          <p className="text-sm text-slate-500">
            Add conditions to route approvals based on specific criteria
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Condition
        </button>
      </div>

      {/* Conditions List */}
      {conditions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-slate-500 mb-2">No conditions defined</p>
          <p className="text-sm text-slate-400">
            Add conditions to create smart approval routing
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-start gap-4">
                {/* Condition Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                {/* Condition Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Condition Type
                    </label>
                    <select
                      value={condition.type}
                      onChange={(e) => updateCondition(condition.id, { type: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      {conditionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Operator
                    </label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(condition.id, { operator: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      {getOperatorsForType(condition.type).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Value
                    </label>
                    <input
                      type={condition.type === 'amount' ? 'number' : 'text'}
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { 
                        value: condition.type === 'amount' ? parseFloat(e.target.value) : e.target.value 
                      })}
                      placeholder={condition.type === 'amount' ? '10000' : 'Enter value...'}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Then
                    </label>
                    <select
                      value={condition.action}
                      onChange={(e) => updateCondition(condition.id, { action: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      {actions.map(action => (
                        <option key={action.value} value={action.value}>
                          {action.icon} {action.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="flex-shrink-0 p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Remove condition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Condition Preview */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                    IF
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {condition.field || condition.type} {condition.operator.replace(/_/g, ' ')} {condition.value}
                  </span>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                    THEN
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {actions.find(a => a.value === condition.action)?.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Example Conditions */}
      {conditions.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Example Conditions
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>If amount &gt; $10,000 → Add CFO approval step</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>If project type = "Emergency" → Escalate immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>If time &gt; 5pm → Change approver to on-call manager</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConditionBuilder;
