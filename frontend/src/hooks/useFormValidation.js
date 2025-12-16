import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for form validation with real-time feedback
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation rules - memoized to prevent recreation on every render
  const validators = useMemo(() => ({
    required: (value) => (!value || value.trim() === '') ? 'Ce champ est requis' : '',
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? 'Email invalide' : '';
    },
    minLength: (min) => (value) => {
      // Handle undefined/null values
      if (value === undefined || value === null) {
        return `Minimum ${min} caractères requis`;
      }
      const length = typeof value === 'string' ? value.length : String(value).length;
      return length < min ? `Minimum ${min} caractères requis` : '';
    },
    maxLength: (max) => (value) => 
      value.length > max ? `Maximum ${max} caractères` : '',
    password: (value) => {
      if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
      if (!/(?=.*[a-z])/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule';
      if (!/(?=.*[A-Z])/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule';
      if (!/(?=.*\d)/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre';
      return '';
    },
    match: (matchValue) => (value) => 
      value !== matchValue ? 'Les valeurs ne correspondent pas' : '',
    phone: (value) => {
      const phoneRegex = /^[\d\s\-+()]+$/;
      return !phoneRegex.test(value) ? 'Numéro de téléphone invalide' : '';
    },
    url: (value) => {
      try {
        new URL(value);
        return '';
      } catch {
        return 'URL invalide';
      }
    },
    number: (value) => {
      const num = Number(value);
      return isNaN(num) ? 'Valeur numérique requise' : '';
    },
    positive: (value) => {
      const num = Number(value);
      return isNaN(num) || num <= 0 ? 'Valeur positive requise' : '';
    },
  }), []);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    for (const rule of rules) {
      let validator;
      let errorMessage = '';

      if (typeof rule === 'string') {
        validator = validators[rule];
        if (validator) {
          errorMessage = validator(value);
        }
      } else if (typeof rule === 'function') {
        errorMessage = rule(value);
      } else if (rule.type && validators[rule.type]) {
        validator = validators[rule.type];
        
        // Check if validator needs a parameter (function factory) or is direct
        // If rule.value exists, it's likely a function factory like minLength(min) => (value) => ...
        if (rule.value !== undefined && typeof validator === 'function') {
          // Validator is a function factory (like minLength: (min) => (value) => ...)
          const validatorFn = validator(rule.value);
          const rawError = validatorFn(value);
          
          // Log for debugging
          console.log(`🔍 Validating ${name} with ${rule.type}:`, {
            field: name,
            ruleType: rule.type,
            ruleValue: rule.value,
            actualValue: name === 'password' ? `***(${value?.length || 0} chars)` : value,
            valueType: typeof value,
            valueLength: value?.length,
            rawError: rawError,
            customMessage: rule.message,
            hasValue: value !== undefined && value !== null,
            valueString: String(value)
          });
          
          errorMessage = rawError;
        } else if (typeof validator === 'function') {
          // Direct validator function
          errorMessage = validator(value);
        }
        
        // Use custom message if provided, otherwise use validator's message
        // IMPORTANT: Only replace if there's an error, don't create error from empty string
        if (errorMessage && rule.message) {
          errorMessage = rule.message;
        }
      }

      if (errorMessage) return errorMessage;
    }

    return '';
  }, [validationRules, validators]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({ ...prev, [name]: fieldValue }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Validate all fields
  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    // Always log validation details for debugging
    console.log('🔍 Validation result:', {
      isValid: isValid,
      errors: newErrors,
      errorCount: Object.keys(newErrors).length,
      values: Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = key === 'password' ? `***(${values[key]?.length || 0} chars)` : values[key];
        return acc;
      }, {}),
      validationRules: Object.keys(validationRules),
      fieldResults: Object.keys(validationRules).map(name => {
        const error = validateField(name, values[name]);
        return {
          field: name,
          value: name === 'password' ? `***(${values[name]?.length || 0} chars)` : values[name],
          error: error,
          hasError: !!error
        };
      })
    });

    return isValid;
  }, [values, validationRules, validateField]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Set field value manually
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValue,
    setValues,
    isValid: Object.keys(errors).length === 0 || Object.values(errors).every(e => !e),
  };
};

