// utils/validator.js
const validator = require('validator');
const { logger } = require('./logger');

class Validator {
  constructor() {
    this.regex = {
      phone: /^\+?[1-9]\d{1,14}$/,
      zipCode: /^\d{5}(-\d{4})?$/,
      ssn: /^\d{3}-\d{2}-\d{4}$/,
      ein: /^\d{2}-\d{7}$/,
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
      hexColor: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
      htmlTag: /<[^>]*>/,
      sqlInjection: /(\b(select|insert|update|delete|drop|alter|create|truncate|union|where|from|join)\b|\b(exec|execute|xp_cmdshell|sp_executesql)\b|\b(or|and)\b\s*[\w\s]*\s*[=<>!]+)/i,
      xss: /(<script|<iframe|<object|<embed|<img.*onerror|<svg.*onload)/i,
      pathTraversal: /(\.\.\/|\.\.\\)|%2e%2e%2f|%2e%2e%5c/,
      commandInjection: /(\b(rm|wget|curl|nc|telnet|ssh|scp|sftp|chmod|chown|cat|echo|eval|system|exec|popen|shell_exec)\b)|[;|&$`]/i
    };
  }

  // Email validation
  isValidEmail(email) {
    try {
      return validator.isEmail(email, {
        allow_display_name: false,
        require_tld: true,
        allow_utf8_local_part: true,
        require_tld: true
      });
    } catch (error) {
      logger.error('Email validation error:', error);
      return false;
    }
  }

  // Phone validation
  isValidPhone(phone) {
    try {
      if (typeof phone === 'string') {
        const cleaned = phone.replace(/[\s\-()]/g, '');
        return this.regex.phone.test(cleaned) && validator.isMobilePhone(cleaned);
      }
      return false;
    } catch (error) {
      logger.error('Phone validation error:', error);
      return false;
    }
  }

  // Password validation
  isValidPassword(password) {
    try {
      const rules = {
        minLength: 8,
        maxLength: 100,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      };

      if (password.length < rules.minLength || password.length > rules.maxLength) {
        return false;
      }

      if (rules.requireUppercase && !/[A-Z]/.test(password)) {
        return false;
      }

      if (rules.requireLowercase && !/[a-z]/.test(password)) {
        return false;
      }

      if (rules.requireNumber && !/[0-9]/.test(password)) {
        return false;
      }

      if (rules.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Password validation error:', error);
      return false;
    }
  }

  // URL validation
  isValidUrl(url, protocols = ['http', 'https']) {
    try {
      return validator.isURL(url, {
        protocols,
        require_protocol: true,
        require_valid_protocol: true,
        allow_underscores: false,
        host_whitelist: false,
        host_blacklist: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false
      });
    } catch (error) {
      logger.error('URL validation error:', error);
      return false;
    }
  }

  // IP address validation
  isValidIP(ip) {
    try {
      return validator.isIP(ip, 4) || validator.isIP(ip, 6);
    } catch (error) {
      logger.error('IP validation error:', error);
      return false;
    }
  }

  // Credit card validation
  isValidCreditCard(cardNumber) {
    try {
      const cleaned = cardNumber.replace(/\s/g, '');
      return validator.isCreditCard(cleaned);
    } catch (error) {
      logger.error('Credit card validation error:', error);
      return false;
    }
  }

  // UUID validation
  isValidUUID(uuid) {
    try {
      return validator.isUUID(uuid, 4);
    } catch (error) {
      logger.error('UUID validation error:', error);
      return false;
    }
  }

  // JSON validation
  isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Date validation
  isValidDate(date) {
    try {
      const d = new Date(date);
      return !isNaN(d.getTime());
    } catch (error) {
      return false;
    }
  }

  // Valid date range
  isValidDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
    } catch (error) {
      return false;
    }
  }

  // Length validation
  isLengthValid(value, min, max) {
    try {
      if (!value) return false;
      const length = typeof value === 'string' ? value.length : String(value).length;
      return length >= min && length <= max;
    } catch (error) {
      return false;
    }
  }

  // Numeric validation
  isNumeric(value) {
    try {
      return validator.isNumeric(String(value));
    } catch (error) {
      return false;
    }
  }

  // Integer validation
  isInteger(value) {
    try {
      return validator.isInt(String(value));
    } catch (error) {
      return false;
    }
  }

  // Float validation
  isFloat(value) {
    try {
      return validator.isFloat(String(value));
    } catch (error) {
      return false;
    }
  }

  // Boolean validation
  isBoolean(value) {
    try {
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    } catch (error) {
      return false;
    }
  }

  // Array validation
  isValidArray(array, minLength = 0, maxLength = Infinity) {
    try {
      return Array.isArray(array) && array.length >= minLength && array.length <= maxLength;
    } catch (error) {
      return false;
    }
  }

  // Object validation
  isValidObject(obj) {
    try {
      return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
    } catch (error) {
      return false;
    }
  }

  // Validate against schema
  validateSchema(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      const fieldErrors = [];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${key} is required`);
        isValid = false;
      }

      // Type check
      if (value !== undefined && value !== null && rules.type) {
        if (typeof value !== rules.type) {
          fieldErrors.push(`${key} must be of type ${rules.type}`);
          isValid = false;
        }
      }

      // Custom validators
      if (value !== undefined && value !== null && rules.validate) {
        const result = rules.validate(value);
        if (result !== true) {
          fieldErrors.push(result);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        errors[key] = fieldErrors;
      }
    }

    return { isValid, errors };
  }

  // Sanitize input
  sanitize(input) {
    if (typeof input === 'string') {
      // Trim whitespace
      let sanitized = input.trim();
      
      // Remove HTML tags
      sanitized = sanitized.replace(this.regex.htmlTag, '');
      
      // Remove potential XSS
      sanitized = sanitized.replace(this.regex.xss, '');
      
      // Escape special characters
      sanitized = validator.escape(sanitized);
      
      // Normalize to NFC
      sanitized = sanitized.normalize('NFC');
      
      return sanitized;
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitize(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const result = {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = this.sanitize(value);
      }
      return result;
    }
    
    return input;
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[\\/:*?"<>|]/g, '_');
  }

  // Check for SQL injection
  hasSQLInjection(input) {
    if (typeof input === 'string') {
      return this.regex.sqlInjection.test(input);
    }
    return false;
  }

  // Check for XSS
  hasXSS(input) {
    if (typeof input === 'string') {
      return this.regex.xss.test(input);
    }
    return false;
  }

  // Check for command injection
  hasCommandInjection(input) {
    if (typeof input === 'string') {
      return this.regex.commandInjection.test(input);
    }
    return false;
  }

  // Check for path traversal
  hasPathTraversal(input) {
    if (typeof input === 'string') {
      return this.regex.pathTraversal.test(input);
    }
    return false;
  }

  // Validate all input for security
  validateSecurity(input) {
    return {
      hasSQLInjection: this.hasSQLInjection(input),
      hasXSS: this.hasXSS(input),
      hasCommandInjection: this.hasCommandInjection(input),
      hasPathTraversal: this.hasPathTraversal(input)
    };
  }

  // Validate emergency data
  validateEmergency(data) {
    const schema = {
      priority: {
        required: true,
        type: 'string',
        validate: (value) => {
          const valid = ['critical', 'high', 'medium', 'low'];
          if (!valid.includes(value)) {
            return `Priority must be one of: ${valid.join(', ')}`;
          }
          return true;
        }
      },
      type: {
        required: true,
        type: 'string',
        validate: (value) => {
          const valid = ['cardiac', 'respiratory', 'trauma', 'stroke', 'burn', 'poisoning', 'obstetric', 'pediatric', 'psychiatric', 'other'];
          if (!valid.includes(value)) {
            return `Type must be one of: ${valid.join(', ')}`;
          }
          return true;
        }
      },
      location: {
        required: true,
        type: 'object',
        validate: (value) => {
          if (!value.address && !value.coordinates) {
            return 'Location must have address or coordinates';
          }
          if (value.coordinates) {
            if (!value.coordinates.lat || !value.coordinates.lng) {
              return 'Coordinates must have lat and lng';
            }
          }
          return true;
        }
      },
      patientInfo: {
        required: false,
        type: 'object'
      }
    };

    return this.validateSchema(data, schema);
  }

  // Validate ambulance data
  validateAmbulance(data) {
    const schema = {
      registrationNumber: {
        required: true,
        type: 'string',
        validate: (value) => {
          if (value.length < 5 || value.length > 20) {
            return 'Registration number must be between 5 and 20 characters';
          }
          return true;
        }
      },
      type: {
        required: true,
        type: 'string',
        validate: (value) => {
          const valid = ['basic', 'advanced', 'critical_care', 'neonatal'];
          if (!valid.includes(value)) {
            return `Type must be one of: ${valid.join(', ')}`;
          }
          return true;
        }
      },
      status: {
        required: false,
        type: 'string',
        validate: (value) => {
          if (value) {
            const valid = ['available', 'on-duty', 'maintenance', 'out-of-service'];
            if (!valid.includes(value)) {
              return `Status must be one of: ${valid.join(', ')}`;
            }
          }
          return true;
        }
      }
    };

    return this.validateSchema(data, schema);
  }

  // Validate employee data
  validateEmployee(data) {
    const schema = {
      email: {
        required: true,
        type: 'string',
        validate: (value) => {
          if (!this.isValidEmail(value)) {
            return 'Invalid email address';
          }
          return true;
        }
      },
      phone: {
        required: true,
        type: 'string',
        validate: (value) => {
          if (!this.isValidPhone(value)) {
            return 'Invalid phone number';
          }
          return true;
        }
      },
      role: {
        required: true,
        type: 'string',
        validate: (value) => {
          const valid = ['paramedic', 'doctor', 'nurse', 'dispatcher', 'admin', 'driver'];
          if (!valid.includes(value)) {
            return `Role must be one of: ${valid.join(', ')}`;
          }
          return true;
        }
      }
    };

    return this.validateSchema(data, schema);
  }

  // Validate payment data
  validatePayment(data) {
    const schema = {
      amount: {
        required: true,
        type: 'number',
        validate: (value) => {
          if (value <= 0) {
            return 'Amount must be greater than 0';
          }
          return true;
        }
      },
      method: {
        required: true,
        type: 'string',
        validate: (value) => {
          const valid = ['credit_card', 'debit_card', 'insurance', 'cash', 'bank_transfer'];
          if (!valid.includes(value)) {
            return `Payment method must be one of: ${valid.join(', ')}`;
          }
          return true;
        }
      }
    };

    return this.validateSchema(data, schema);
  }
}

module.exports = new Validator();
