import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Reusable form field component with validation feedback
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  icon: Icon,
  helpText,
  autoComplete,
  className = '',
  ...props
}) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon 
            size={20} 
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              hasError ? 'text-red-500' : isValid ? 'text-green-500' : 'text-gray-400'
            } transition-colors`} 
          />
        )}
        
        <input
          type={type}
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 border rounded-lg transition-all ${
            hasError
              ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : isValid
              ? 'border-green-500 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...props}
        />
        
        {/* Validation icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {hasError && (
            <AlertCircle size={18} className="text-red-500" aria-hidden="true" />
          )}
          {isValid && (
            <CheckCircle size={18} className="text-green-500" aria-hidden="true" />
          )}
        </div>
      </div>
      
      {/* Error message */}
      {hasError && (
        <p 
          id={`${name}-error`}
          className="mt-1 text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      
      {/* Help text */}
      {!hasError && helpText && (
        <p 
          id={`${name}-help`}
          className="mt-1 text-xs text-gray-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;

