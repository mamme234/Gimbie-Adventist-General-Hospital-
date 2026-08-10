/**
 * Gimbie Adventist General Hospital - API Client
 * Complete API integration for all endpoints
 */

// ============================================
// API BASE URL - FIXED FOR RENDER
// ============================================
const API_BASE_URL = 'https://alpha-af1q.onrender.com/api';

// ============================================
// TOKEN MANAGEMENT
// ============================================
const getToken = () => localStorage.getItem('token');
const setToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

const setCurrentUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
};

// ============================================
// API REQUEST HELPER
// ============================================
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ============================================
// AUTH API
// ============================================
const authAPI = {
    register: async (userData) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (response.success && response.token) {
            setToken(response.token);
            setCurrentUser(response.user);
        }
        
        return response;
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },

    updateProfile: async (data) => {
        return apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    forgotPassword: async (email) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (token, newPassword) => {
        return apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    },

    logout: () => {
        setToken(null);
        setCurrentUser(null);
        window.location.href = '/pages/login.html';
    },
};

// ============================================
// PATIENT API
// ============================================
const patientAPI = {
    getMe: async () => {
        return apiRequest('/patients/me');
    },

    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/patients?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/patients/${id}`);
    },

    create: async (data) => {
        return apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/patients/${id}`, {
            method: 'DELETE',
        });
    },

    search: async (query) => {
        return apiRequest(`/patients/search?q=${encodeURIComponent(query)}`);
    },

    getHistory: async (id) => {
        return apiRequest(`/patients/${id}/history`);
    },

    getAppointments: async (id) => {
        return apiRequest(`/patients/${id}/appointments`);
    },

    getBills: async (id) => {
        return apiRequest(`/patients/${id}/bills`);
    },

    getLabResults: async (id) => {
        return apiRequest(`/patients/${id}/lab-results`);
    },

    getRadiology: async (id) => {
        return apiRequest(`/patients/${id}/radiology`);
    },
};

// ============================================
// DOCTOR API
// ============================================
const doctorAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/doctors/${id}`);
    },

    getByDepartment: async (department) => {
        return apiRequest(`/doctors/by-department/${department}`);
    },

    create: async (data) => {
        return apiRequest('/doctors', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/doctors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/doctors/${id}`, {
            method: 'DELETE',
        });
    },

    getAppointments: async (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors/${id}/appointments?${query}`);
    },

    getPatients: async (id) => {
        return apiRequest(`/doctors/${id}/patients`);
    },

    getAvailability: async (id) => {
        return apiRequest(`/doctors/${id}/availability`);
    },

    updateAvailability: async (id, data) => {
        return apiRequest(`/doctors/${id}/availability`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ============================================
// APPOINTMENT API
// ============================================
const appointmentAPI = {
    book: async (data) => {
        return apiRequest('/appointments/book', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/appointments/${id}`);
    },

    create: async (data) => {
        return apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    cancel: async (id, reason) => {
        return apiRequest(`/appointments/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },

    reschedule: async (id, date, time) => {
        return apiRequest(`/appointments/${id}/reschedule`, {
            method: 'PUT',
            body: JSON.stringify({ date, time }),
        });
    },

    getToday: async () => {
        return apiRequest('/appointments/today');
    },

    getQueue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments/queue?${query}`);
    },

    getPatientAppointments: async (patientId) => {
        return apiRequest(`/appointments/patient/${patientId}`);
    },
};

// ============================================
// PHARMACY API
// ============================================
const pharmacyAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/pharmacy?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/pharmacy/${id}`);
    },

    create: async (data) => {
        return apiRequest('/pharmacy', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/pharmacy/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/pharmacy/${id}`, {
            method: 'DELETE',
        });
    },

    getLowStock: async () => {
        return apiRequest('/pharmacy/low-stock');
    },

    getExpiring: async (days = 30) => {
        return apiRequest(`/pharmacy/expiring?days=${days}`);
    },

    dispense: async (id, data) => {
        return apiRequest(`/pharmacy/${id}/dispense`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    restock: async (id, data) => {
        return apiRequest(`/pharmacy/${id}/restock`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ============================================
// LABORATORY API
// ============================================
const laboratoryAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/laboratory?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/laboratory/${id}`);
    },

    create: async (data) => {
        return apiRequest('/laboratory', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    collectSample: async (id) => {
        return apiRequest(`/laboratory/${id}/collect-sample`, {
            method: 'PUT',
        });
    },

    enterResults: async (id, data) => {
        return apiRequest(`/laboratory/${id}/enter-results`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    verifyResults: async (id) => {
        return apiRequest(`/laboratory/${id}/verify-results`, {
            method: 'PUT',
        });
    },

    getPending: async () => {
        return apiRequest('/laboratory/pending');
    },

    getPatientResults: async (patientId) => {
        return apiRequest(`/laboratory/patient/${patientId}`);
    },
};

// ============================================
// BILLING API
// ============================================
const billingAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing?${query}`);
    },

    get: async (id) => {
        return apiRequest(`/billing/${id}`);
    },

    create: async (data) => {
        return apiRequest('/billing', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    pay: async (id, data) => {
        return apiRequest(`/billing/${id}/pay`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    getPatientInvoices: async (patientId) => {
        return apiRequest(`/billing/patient/${patientId}`);
    },

    getOutstanding: async () => {
        return apiRequest('/billing/outstanding');
    },

    getRevenue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/revenue?${query}`);
    },
};

// ============================================
// DEPARTMENT API
// ============================================
const departmentAPI = {
    getAll: async () => {
        return apiRequest('/departments');
    },

    getActive: async () => {
        return apiRequest('/departments/active');
    },

    get: async (id) => {
        return apiRequest(`/departments/${id}`);
    },
};

// ============================================
// TESTIMONIAL API
// ============================================
const testimonialAPI = {
    getAll: async () => {
        return apiRequest('/testimonials');
    },

    getApproved: async () => {
        return apiRequest('/testimonials/approved');
    },

    getFeatured: async () => {
        return apiRequest('/testimonials/featured');
    },

    create: async (data) => {
        return apiRequest('/testimonials', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ============================================
// NOTIFICATION API
// ============================================
const notificationAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/notifications?${query}`);
    },

    markAsRead: async (id) => {
        return apiRequest(`/notifications/${id}`, {
            method: 'PUT',
        });
    },

    markAllAsRead: async () => {
        return apiRequest('/notifications/mark-all-read', {
            method: 'PUT',
        });
    },

    getUnreadCount: async () => {
        return apiRequest('/notifications/unread-count');
    },

    delete: async (id) => {
        return apiRequest(`/notifications/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============================================
// BED API
// ============================================
const bedAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/beds?${query}`);
    },

    getAvailable: async () => {
        return apiRequest('/beds/available');
    },

    getOccupied: async () => {
        return apiRequest('/beds/occupied');
    },

    getStats: async () => {
        return apiRequest('/beds/stats');
    },

    assign: async (bedId, patientId) => {
        return apiRequest(`/beds/${bedId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ patientId }),
        });
    },

    discharge: async (bedId) => {
        return apiRequest(`/beds/${bedId}/discharge`, {
            method: 'PUT',
        });
    },
};

// ============================================
// STAFF API
// ============================================
const staffAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/staff?${query}`);
    },

    getByDepartment: async (department) => {
        return apiRequest(`/staff/department/${department}`);
    },

    getByPosition: async (position) => {
        return apiRequest(`/staff/position/${position}`);
    },
};

// ============================================
// REPORTS API
// ============================================
const reportsAPI = {
    getPatientStats: async () => {
        return apiRequest('/reports/patients');
    },

    getDoctorStats: async () => {
        return apiRequest('/reports/doctors');
    },

    getDepartmentStats: async () => {
        return apiRequest('/reports/departments');
    },

    getAdmissions: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reports/admissions?${query}`);
    },

    getBedOccupancy: async () => {
        return apiRequest('/reports/bed-occupancy');
    },

    getRevenue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reports/revenue?${query}`);
    },

    getFinancial: async () => {
        return apiRequest('/reports/financial');
    },

    getMedical: async () => {
        return apiRequest('/reports/medical');
    },
};

// ============================================
// EXPORT ALL
// ============================================
const API = {
    auth: authAPI,
    patients: patientAPI,
    doctors: doctorAPI,
    appointments: appointmentAPI,
    pharmacy: pharmacyAPI,
    laboratory: laboratoryAPI,
    billing: billingAPI,
    departments: departmentAPI,
    testimonials: testimonialAPI,
    notifications: notificationAPI,
    beds: bedAPI,
    staff: staffAPI,
    reports: reportsAPI,
    getToken,
    setToken,
    getCurrentUser,
    setCurrentUser,
};

// Make API globally available
window.API = API;

export default API;
