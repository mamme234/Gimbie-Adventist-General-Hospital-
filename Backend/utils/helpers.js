const crypto = require('crypto');

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: ETB)
 * @returns {string} - Formatted currency
 */
const formatCurrency = (amount, currency = 'ETB') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (default: 'MMM DD, YYYY')
 * @returns {string} - Formatted date
 */
const formatDate = (date, format = 'MMM DD, YYYY') => {
    const d = new Date(date);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    return d.toLocaleDateString('en-US', options);
};

/**
 * Format time
 * @param {string} time - Time string (HH:MM)
 * @returns {string} - Formatted time (HH:MM AM/PM)
 */
const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} - Truncated text
 */
const truncateText = (text, length = 100, suffix = '...') => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
};

/**
 * Generate OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - OTP
 */
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Calculate days between two dates
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {number} - Number of days
 */
const daysBetween = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is in range
 * @param {Date|string} date - Date to check
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {boolean} - True if date is in range
 */
const isDateInRange = (date, start, end) => {
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    return d >= s && d <= e;
};

/**
 * Get day of week
 * @param {Date|string} date - Date
 * @returns {string} - Day of week
 */
const getDayOfWeek = (date) => {
    const d = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
};

/**
 * Check if it's weekend
 * @param {Date|string} date - Date
 * @returns {boolean} - True if weekend
 */
const isWeekend = (date) => {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
};

/**
 * Convert to camel case
 * @param {string} str - String to convert
 * @returns {string} - Camel case string
 */
const toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
};

/**
 * Convert to snake case
 * @param {string} str - String to convert
 * @returns {string} - Snake case string
 */
const toSnakeCase = (str) => {
    return str.replace(/\s+/g, '_').toLowerCase();
};

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty
 */
const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

/**
 * Get random color
 * @returns {string} - Random hex color
 */
const getRandomColor = () => {
    const colors = [
        '#0f5c2e', '#1a7a4a', '#2d8a5e', '#4a9a72',
        '#0d47a1', '#1565c0', '#1e88e5', '#42a5f5',
        '#b71c1c', '#c62828', '#d32f2f', '#e53935',
        '#e65100', '#f57c00', '#fb8c00', '#ff9800',
        '#4a148c', '#6a1b9a', '#8e24aa', '#ab47bc',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

module.exports = {
    formatCurrency,
    formatDate,
    formatTime,
    formatPhone,
    truncateText,
    generateRandomString,
    generateOTP,
    calculateAge,
    daysBetween,
    isDateInRange,
    getDayOfWeek,
    isWeekend,
    toCamelCase,
    toSnakeCase,
    isEmpty,
    getInitials,
    getRandomColor,
};
