/**
 * Utility Functions
 * Helper functions used across the application
 */

// ===== DATE FORMATTING =====
export const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

export const formatDateInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

export const getAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const getDayOfWeek = (date) => {
    if (!date) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
};

// ===== CURRENCY FORMATTING =====
export const formatCurrency = (amount, currency = 'ETB') => {
    if (amount === undefined || amount === null) return '0.00 ETB';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// ===== PHONE FORMATTING =====
export const formatPhone = (phone) => {
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

// ===== STRING HELPERS =====
export const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const truncateText = (text, length = 100, suffix = '...') => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
};

export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toCamelCase = (str) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
};

export const toSnakeCase = (str) => {
    return str.replace(/\s+/g, '_').toLowerCase();
};

// ===== VALIDATION =====
export const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

export const isValidPhone = (phone) => {
    const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return regex.test(phone);
};

export const isValidEthiopianPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(09|07|02)[0-9]{8}$/.test(cleaned) || /^\+251[0-9]{9}$/.test(phone);
};

// ===== RANDOM HELPERS =====
export const generateId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`.toUpperCase();
};

export const getRandomColor = () => {
    const colors = [
        '#0f5c2e', '#1a7a4a', '#2d8a5e', '#4a9a72',
        '#0d47a1', '#1565c0', '#1e88e5', '#42a5f5',
        '#b71c1c', '#c62828', '#d32f2f', '#e53935',
        '#e65100', '#f57c00', '#fb8c00', '#ff9800',
        '#4a148c', '#6a1b9a', '#8e24aa', '#ab47bc',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// ===== STATUS HELPERS =====
export const getStatusColor = (status) => {
    const colors = {
        'Active': '#4CAF50',
        'Inactive': '#F44336',
        'Pending': '#FF9800',
        'Confirmed': '#4CAF50',
        'Scheduled': '#2196F3',
        'Completed': '#4CAF50',
        'Cancelled': '#F44336',
        'No Show': '#9E9E9E',
        'Paid': '#4CAF50',
        'Unpaid': '#F44336',
        'Partially Paid': '#FF9800',
        'Available': '#4CAF50',
        'Occupied': '#F44336',
        'Reserved': '#FF9800',
        'Under Maintenance': '#9E9E9E',
        'Emergency': '#F44336',
        'Urgent': '#FF9800',
        'Routine': '#2196F3',
        'Low Stock': '#FF9800',
        'Out of Stock': '#F44336',
    };
    return colors[status] || '#9E9E9E';
};

export const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return `<span class="badge" style="background:${color};color:#fff;">${status}</span>`;
};

// ===== DATE RANGE HELPERS =====
export const daysBetween = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isToday = (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

export const isThisWeek = (date) => {
    const now = new Date();
    const d = new Date(date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return d >= startOfWeek && d <= endOfWeek;
};

// ===== EXPORT ALL =====
export default {
    formatDate,
    formatDateTime,
    formatTime,
    formatDateInput,
    getAge,
    getDayOfWeek,
    formatCurrency,
    formatPhone,
    getInitials,
    truncateText,
    capitalize,
    toCamelCase,
    toSnakeCase,
    isValidEmail,
    isValidPhone,
    isValidEthiopianPhone,
    generateId,
    getRandomColor,
    getStatusColor,
    getStatusBadge,
    daysBetween,
    isToday,
    isThisWeek,
};
