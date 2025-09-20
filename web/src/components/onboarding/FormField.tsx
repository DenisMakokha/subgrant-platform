import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  icon?: React.ReactNode;
  options?: { value: string; label: string }[];
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  helpText,
  icon,
  options
}) => {
  const inputClasses = `
    w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-300 font-medium
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-600 dark:focus:ring-red-900/20' 
      : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
    }
    text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
    shadow-sm hover:shadow-md focus:shadow-lg
    ${icon ? 'pl-12' : ''}
  `;

  return (
    <div className="space-y-3">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1.5 text-base">*</span>}
      </label>
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
            {icon}
          </div>
        )}
        
        {type === 'select' && options ? (
          <select
            id={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClasses} cursor-pointer`}
          >
            <option value="" className="text-slate-400">Select {label.toLowerCase()}</option>
            {options.map(option => (
              <option key={option.value} value={option.value} className="text-slate-900 dark:text-white">
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`${inputClasses} resize-none`}
          />
        ) : (
          <input
            id={name}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
        
        {/* Success indicator when field has value and no error */}
        {value && !error && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {helpText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
          <svg className="w-3 h-3 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {helpText}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
