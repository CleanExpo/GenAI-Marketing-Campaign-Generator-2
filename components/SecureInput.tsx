/**
 * Secure Input Component
 * Provides input validation, sanitization, and XSS prevention for all user inputs
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SecurityServiceAPI } from '../services/securityService';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'textarea';
  placeholder?: string;
  className?: string;
  maxLength?: number;
  required?: boolean;
  validationRules?: ValidationRule[];
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  sanitizeOnBlur?: boolean;
  allowedTags?: string[];
}

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  maxLength = 10000,
  required = false,
  validationRules = [],
  onValidationChange,
  sanitizeOnBlur = true,
  allowedTags = []
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Validation function
  const validateInput = useCallback((inputValue: string): { isValid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];

    // Required validation
    if (required && !inputValue.trim()) {
      validationErrors.push('This field is required');
    }

    // Length validation
    if (!SecurityServiceAPI.validateInputLength(inputValue, maxLength)) {
      validationErrors.push(`Input must be ${maxLength} characters or less`);
    }

    // Type-specific validation
    switch (type) {
      case 'email':
        if (inputValue && !SecurityServiceAPI.validateEmail(inputValue)) {
          validationErrors.push('Please enter a valid email address');
        }
        break;
      case 'url':
        if (inputValue && !SecurityServiceAPI.validateURL(inputValue)) {
          validationErrors.push('Please enter a valid URL (http:// or https://)');
        }
        break;
    }

    // General input validation (SQL injection, etc.)
    if (inputValue && !SecurityServiceAPI.validateInput(inputValue)) {
      validationErrors.push('Input contains invalid characters or patterns');
    }

    // Custom validation rules
    validationRules.forEach(rule => {
      if (inputValue && !rule.test(inputValue)) {
        validationErrors.push(rule.message);
      }
    });

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  }, [required, maxLength, type, validationRules]);

  // Handle input change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setDisplayValue(newValue);

    // Real-time validation
    const validation = validateInput(newValue);
    setErrors(validation.errors);
    setIsValid(validation.isValid);

    // Call validation change callback
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.errors);
    }

    // Update parent with raw value (sanitization happens on blur)
    onChange(newValue);
  }, [validateInput, onChange, onValidationChange]);

  // Handle blur (sanitization)
  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (sanitizeOnBlur && displayValue) {
      const sanitized = SecurityServiceAPI.sanitizeInput(displayValue);

      if (sanitized !== displayValue) {
        setDisplayValue(sanitized);
        onChange(sanitized);

        // Re-validate after sanitization
        const validation = validateInput(sanitized);
        setErrors(validation.errors);
        setIsValid(validation.isValid);

        if (onValidationChange) {
          onValidationChange(validation.isValid, validation.errors);
        }
      }
    }
  }, [displayValue, sanitizeOnBlur, onChange, validateInput, onValidationChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Determine input styling based on validation state
  const getInputClassName = () => {
    const baseClass = `w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${className}`;

    if (isFocused) {
      return `${baseClass} border-cyan-500 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`;
    }

    if (!isValid && errors.length > 0) {
      return `${baseClass} border-red-500 bg-red-50 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500`;
    }

    return `${baseClass} border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`;
  };

  // Render error messages
  const renderErrors = () => {
    if (errors.length === 0 || isFocused) return null;

    return (
      <div className="mt-1 space-y-1">
        {errors.map((error, index) => (
          <p key={index} className="text-sm text-red-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        ))}
      </div>
    );
  };

  // Render character count
  const renderCharacterCount = () => {
    if (!maxLength || maxLength > 1000) return null;

    const count = displayValue.length;
    const isNearLimit = count > maxLength * 0.8;

    return (
      <div className={`mt-1 text-xs text-right ${isNearLimit ? 'text-yellow-500' : 'text-slate-400'}`}>
        {count}/{maxLength}
      </div>
    );
  };

  // Render security indicator
  const renderSecurityIndicator = () => {
    if (!displayValue) return null;

    const hasBeenSanitized = SecurityServiceAPI.sanitizeInput(displayValue) !== displayValue;

    return (
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs text-green-500">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Input Protected
          </div>
          {hasBeenSanitized && (
            <div className="text-xs text-blue-500">
              Content Sanitized
            </div>
          )}
        </div>
        {renderCharacterCount()}
      </div>
    );
  };

  if (type === 'textarea') {
    return (
      <div>
        <textarea
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={getInputClassName()}
          maxLength={maxLength}
          rows={4}
        />
        {renderErrors()}
        {renderSecurityIndicator()}
      </div>
    );
  }

  return (
    <div>
      <input
        type={type === 'url' || type === 'email' ? type : 'text'}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={getInputClassName()}
        maxLength={maxLength}
      />
      {renderErrors()}
      {renderSecurityIndicator()}
    </div>
  );
};

/**
 * Secure URL Input Component
 * Specialized component for URL inputs with enhanced validation
 */
export const SecureURLInput: React.FC<Omit<SecureInputProps, 'type' | 'validationRules'> & {
  allowedDomains?: string[];
}> = ({ allowedDomains, ...props }) => {
  const urlValidationRules: ValidationRule[] = [
    {
      test: (value: string) => {
        if (!value) return true;

        try {
          const url = new URL(value);

          // Check allowed domains if specified
          if (allowedDomains && allowedDomains.length > 0) {
            return allowedDomains.some(domain =>
              url.hostname === domain || url.hostname.endsWith('.' + domain)
            );
          }

          return true;
        } catch {
          return false;
        }
      },
      message: allowedDomains
        ? `URL must be from allowed domains: ${allowedDomains.join(', ')}`
        : 'Invalid URL format'
    }
  ];

  return (
    <SecureInput
      {...props}
      type="url"
      validationRules={urlValidationRules}
    />
  );
};

/**
 * Secure Email Input Component
 */
export const SecureEmailInput: React.FC<Omit<SecureInputProps, 'type'>> = (props) => {
  return <SecureInput {...props} type="email" />;
};

export default SecureInput;