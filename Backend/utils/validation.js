/**
 * Validation helpers
 */

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhone = (phone) => {
    const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return regex.test(phone);
};

/**
 * Validate date
 * @param {string} date - Date to validate
 * @returns {boolean} - True if valid
 */
const isValidDate = (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

/**
 * Validate time (HH:MM)
 * @param {string} time - Time to validate
 * @returns {boolean} - True if valid
 */
const isValidTime = (time) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePasswordStrength = (password) => {
    const result = {
        isValid: true,
        errors: [],
    };

    if (password.length < 6) {
        result.isValid = false;
        result.errors.push('Password must be at least 6 characters long');
    }

    if (!/[a-z]/.test(password)) {
        result.isValid = false;
        result.errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        result.isValid = false;
        result.errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        result.isValid = false;
        result.errors.push('Password must contain at least one number');
    }

    return result;
};

/**
 * Validate Ethiopian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidEthiopianPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(09|07|02)[0-9]{8}$/.test(cleaned) || /^\+251[0-9]{9}$/.test(phone);
};

/**
 * Validate Ethiopian ID number (Kebele ID)
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid
 */
const isValidEthiopianID = (id) => {
    // Basic validation - adjust as needed
    return id && id.length >= 5 && id.length <= 20;
};

/**
 * Validate if value is a number
 * @param {*} value - Value to validate
 * @returns {boolean} - True if number
 */
const isNumber = (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validate if value is an integer
 * @param {*} value - Value to validate
 * @returns {boolean} - True if integer
 */
const isInteger = (value) => {
    return Number.isInteger(Number(value));
};

/**
 * Validate if value is in range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if in range
 */
const isInRange = (value, min, max) => {
    const num = Number(value);
    return num >= min && num <= max;
};

/**
 * Validate if string length is in range
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} - True if in range
 */
const isLengthInRange = (value, min, max) => {
    return value && value.length >= min && value.length <= max;
};

/**
 * Validate if value is in enum
 * @param {*} value - Value to validate
 * @param {Array} enumValues - Allowed values
 * @returns {boolean} - True if in enum
 */
const isInEnum = (value, enumValues) => {
    return enumValues.includes(value);
};

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidDate,
    isValidTime,
    validatePasswordStrength,
    isValidEthiopianPhone,
    isValidEthiopianID,
    isNumber,
    isInteger,
    isInRange,
    isLengthInRange,
    isInEnum,
};
