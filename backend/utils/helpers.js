// utils/helpers.js
class Helpers {
  // Sleep/delay
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry operation
  async retry(fn, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await this.delay(delay * (i + 1));
        }
      }
    }
    throw lastError;
  }

  // Generate random string
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate random number
  generateRandomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Unique array
  uniqueArray(array) {
    return [...new Set(array)];
  }

  // Group by
  groupBy(array, key) {
    const result = {};
    for (const item of array) {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
    }
    return result;
  }

  // Sort by
  sortBy(array, key, direction = 'asc') {
    const sorted = [...array];
    const multiplier = direction === 'desc' ? -1 : 1;
    
    return sorted.sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];
      
      if (aVal < bVal) return -1 * multiplier;
      if (aVal > bVal) return 1 * multiplier;
      return 0;
    });
  }

  // Chunk array
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Deep clone
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Get nested value
  getNestedValue(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  // Set nested value
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    return obj;
  }

  // Remove empty values
  removeEmpty(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue;
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        const nested = this.removeEmpty(value);
        if (Object.keys(nested).length > 0) {
          result[key] = nested;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // Pick properties
  pick(obj, keys) {
    const result = {};
    for (const key of keys) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  // Omit properties
  omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }

  // Is empty object
  isEmptyObject(obj) {
    return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
  }

  // Format bytes
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Get environment variable
  env(key, defaultValue = null) {
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
  }

  // Check if in development
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  // Check if in production
  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  // Check if in test
  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  // Get current timestamp
  timestamp() {
    return new Date().toISOString();
  }

  // Escape HTML
  escapeHtml(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (match) => map[match]);
  }

  // Truncate string
  truncate(str, length = 100, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  // Convert to title case
  toTitleCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

module.exports = new Helpers();
