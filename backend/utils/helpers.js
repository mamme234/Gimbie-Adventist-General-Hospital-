// utils/helpers.js
const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

class Helpers {
  constructor() {
    this.sleep = promisify(setTimeout);
  }

  // Sleep/delay
  async delay(ms) {
    return this.sleep(ms);
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

  // Timeout wrapper
  async timeout(promise, ms = 30000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  // Debounce
  debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  // Throttle
  throttle(fn, limit = 1000) {
    let lastCall = 0;
    let timeoutId;
    return (...args) => {
      const now = Date.now();
      const remaining = limit - (now - lastCall);
      
      if (remaining <= 0) {
        lastCall = now;
        return fn(...args);
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, remaining);
    };
  }

  // Memoize
  memoize(fn, keyFn = null) {
    const cache = new Map();
    
    return (...args) => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }

  // Deep clone
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Deep merge
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  // Get nested value
  getNestedValue(obj, path, defaultValue = undefined) {
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
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
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

  // Transform object keys
  transformKeys(obj, transform) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = transform(key);
      result[newKey] = value;
    }
    return result;
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

  // Generate random string
  generateRandomString(length = 32, charset = null) {
    const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const chars = charset || defaultCharset;
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
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

  // Flatten array
  flattenArray(array) {
    const result = [];
    for (const item of array) {
      if (Array.isArray(item)) {
        result.push(...this.flattenArray(item));
      } else {
        result.push(item);
      }
    }
    return result;
  }

  // Compare arrays
  compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i] !== sorted2[i]) return false;
    }
    
    return true;
  }

  // Intersect arrays
  intersectArrays(arr1, arr2) {
    return arr1.filter(item => arr2.includes(item));
  }

  // Difference arrays
  diffArrays(arr1, arr2) {
    return arr1.filter(item => !arr2.includes(item));
  }

  // Is object empty
  isEmptyObject(obj) {
    return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
  }

  // Is string
  isString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  // Is number
  isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  // Is boolean
  isBoolean(value) {
    return typeof value === 'boolean';
  }

  // Is function
  isFunction(value) {
    return typeof value === 'function';
  }

  // Is object
  isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  // Is array
  isArray(value) {
    return Array.isArray(value);
  }

  // Is date
  isDate(value) {
    return value instanceof Date && !isNaN(value.getTime());
  }

  // Is promise
  isPromise(value) {
    return value && typeof value.then === 'function';
  }

  // Is email
  isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Is phone
  isPhone(phone) {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone);
  }

  // Is URL
  isURL(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Is IP
  isIP(ip) {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6 = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    return ipv4.test(ip) || ipv6.test(ip);
  }

  // Is hex color
  isHexColor(color) {
    const re = /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    return re.test(color);
  }

  // Is credit card
  isCreditCard(card) {
    const cleaned = card.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) return false;
    
    // Luhn algorithm
    let sum = 0;
    let double = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      double = !double;
    }
    
    return sum % 10 === 0;
  }

  // Get file extension
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  // Get MIME type
  getMimeType(filename) {
    const mimeTypes = {
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4'
    };
    
    const ext = this.getFileExtension(filename);
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Get file size
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Get file stats
  getFileStats(filePath) {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      return null;
    }
  }

  // Ensure directory exists
  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Delete directory
  deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  // Copy directory
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Get system info
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: this.formatBytes(os.totalmem()),
        free: this.formatBytes(os.freemem()),
        used: this.formatBytes(os.totalmem() - os.freemem())
      },
      uptime: this.formatDuration(os.uptime()),
      hostname: os.hostname(),
      loadAverage: os.loadavg()
    };
  }

  // Format duration
  formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
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

  // Convert to JSON
  toJSON(data) {
    try {
      return JSON.stringify(data);
    } catch (error) {
      return null;
    }
  }

  // Parse JSON
  parseJSON(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
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

  // Unescape HTML
  unescapeHtml(str) {
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'"
    };
    
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (match) => map[match]);
  }

  // Truncate string
  truncate(str, length = 100, suffix = '...') {
    if (str.length <= length) return str;
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

  // Convert to camel case
  toCamelCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  // Convert to snake case
  toSnakeCase(str) {
    return str
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }

  // Convert to kebab case
  toKebabCase(str) {
    return str
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .toLowerCase();
  }
}

module.exports = new Helpers();
