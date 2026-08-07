// utils/validator.js
class Validator {
  // Email validation
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Phone validation
  isValidPhone(phone) {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone.replace(/[\s\-()]/g, ''));
  }

  // Password validation
  isValidPassword(password) {
    if (password.length < 8) return false;
    if (password.length > 100) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  // URL validation
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Numeric validation
  isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  // Integer validation
  isInteger(value) {
    return Number.isInteger(value);
  }

  // Boolean validation
  isBoolean(value) {
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  }

  // Array validation
  isValidArray(array, minLength = 0) {
    return Array.isArray(array) && array.length >= minLength;
  }

  // Object validation
  isValidObject(obj) {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
  }

  // Sanitize input
  sanitize(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/<[^>]*>/g, '');
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

  // Validate emergency data
  validateEmergency(data) {
    const errors = [];
    
    if (!data.priority) {
      errors.push('Priority is required');
    } else if (!['critical', 'high', 'medium', 'low'].includes(data.priority)) {
      errors.push('Invalid priority');
    }

    if (!data.type) {
      errors.push('Type is required');
    }

    if (!data.location) {
      errors.push('Location is required');
    } else if (!data.location.address && !data.location.coordinates) {
      errors.push('Location must have address or coordinates');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate payment data
  validatePayment(data) {
    const errors = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.bank) {
      errors.push('Bank is required');
    }

    if (!data.customerEmail) {
      errors.push('Customer email is required');
    } else if (!this.isValidEmail(data.customerEmail)) {
      errors.push('Invalid email address');
    }

    if (!data.customerPhone) {
      errors.push('Customer phone is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new Validator();
