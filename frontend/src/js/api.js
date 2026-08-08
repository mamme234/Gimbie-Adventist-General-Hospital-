/**
 * Gimbie Adventist General Hospital - API Client
 * Handles all API calls to the backend
 */

const API_BASE_URL = 'https://alpha-af1q.onrender.com/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Set auth token
const setToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

// Get current user from localStorage
const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Set current user
const setCurrentUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
};

// API request helper
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

// ===== AUTH API =====
const authAPI = {
    // Register user
    register: async (userData) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // Login user
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

    // Get current user
    getMe: async () => {
        return apiRequest('/auth/me');
    },

    // Update profile
    updateProfile: async (data) => {
        return apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Change password
    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    // Forgot password
    forgotPassword: async (email) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    // Reset password
    resetPassword: async (token, newPassword) => {
        return apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    },

    // Logout
    logout: () => {
        setToken(null);
        setCurrentUser(null);
        window.location.href = '/pages/login.html';
    },
};

// ===== PATIENT API =====
const patientAPI = {
    // Get all patients
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/patients?${query}`);
    },

    // Get single patient
    get: async (id) => {
        return apiRequest(`/patients/${id}`);
    },

    // Create patient
    create: async (data) => {
        return apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update patient
    update: async (id, data) => {
        return apiRequest(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete patient
    delete: async (id) => {
        return apiRequest(`/patients/${id}`, {
            method: 'DELETE',
        });
    },

    // Search patients
    search: async (query) => {
        return apiRequest(`/patients/search?q=${encodeURIComponent(query)}`);
    },

    // Get patient history
    getHistory: async (id) => {
        return apiRequest(`/patients/${id}/history`);
    },

    // Get patient appointments
    getAppointments: async (id) => {
        return apiRequest(`/patients/${id}/appointments`);
    },

    // Get patient bills
    getBills: async (id) => {
        return apiRequest(`/patients/${id}/bills`);
    },

    // Get patient lab results
    getLabResults: async (id) => {
        return apiRequest(`/patients/${id}/lab-results`);
    },
};

// ===== DOCTOR API =====
const doctorAPI = {
    // Get all doctors
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors?${query}`);
    },

    // Get single doctor
    get: async (id) => {
        return apiRequest(`/doctors/${id}`);
    },

    // Get doctor by department
    getByDepartment: async (department) => {
        return apiRequest(`/doctors/by-department/${department}`);
    },

    // Get doctor appointments
    getAppointments: async (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors/${id}/appointments?${query}`);
    },

    // Get doctor patients
    getPatients: async (id) => {
        return apiRequest(`/doctors/${id}/patients`);
    },

    // Get doctor availability
    getAvailability: async (id) => {
        return apiRequest(`/doctors/${id}/availability`);
    },

    // Update availability
    updateAvailability: async (id, data) => {
        return apiRequest(`/doctors/${id}/availability`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ===== APPOINTMENT API =====
const appointmentAPI = {
    // Get all appointments
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments?${query}`);
    },

    // Get single appointment
    get: async (id) => {
        return apiRequest(`/appointments/${id}`);
    },

    // Create appointment
    create: async (data) => {
        return apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update appointment
    update: async (id, data) => {
        return apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Cancel appointment
    cancel: async (id, reason) => {
        return apiRequest(`/appointments/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },

    // Reschedule appointment
    reschedule: async (id, date, time) => {
        return apiRequest(`/appointments/${id}/reschedule`, {
            method: 'PUT',
            body: JSON.stringify({ date, time }),
        });
    },

    // Get today's appointments
    getToday: async () => {
        return apiRequest('/appointments/today');
    },

    // Get queue
    getQueue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments/queue?${query}`);
    },

    // Get doctor availability
    getDoctorAvailability: async (doctorId, date) => {
        return apiRequest(`/appointments/availability/${doctorId}?date=${date}`);
    },
};

// ===== PHARMACY API =====
const pharmacyAPI = {
    // Get all medications
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/pharmacy?${query}`);
    },

    // Get single medication
    get: async (id) => {
        return apiRequest(`/pharmacy/${id}`);
    },

    // Create medication
    create: async (data) => {
        return apiRequest('/pharmacy', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update medication
    update: async (id, data) => {
        return apiRequest(`/pharmacy/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete medication
    delete: async (id) => {
        return apiRequest(`/pharmacy/${id}`, {
            method: 'DELETE',
        });
    },

    // Get low stock
    getLowStock: async () => {
        return apiRequest('/pharmacy/low-stock');
    },

    // Get expiring medications
    getExpiring: async (days = 30) => {
        return apiRequest(`/pharmacy/expiring?days=${days}`);
    },

    // Dispense medication
    dispense: async (id, data) => {
        return apiRequest(`/pharmacy/${id}/dispense`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Restock medication
    restock: async (id, data) => {
        return apiRequest(`/pharmacy/${id}/restock`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ===== LABORATORY API =====
const laboratoryAPI = {
    // Get all lab tests
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/laboratory?${query}`);
    },

    // Get single lab test
    get: async (id) => {
        return apiRequest(`/laboratory/${id}`);
    },

    // Create lab test
    create: async (data) => {
        return apiRequest('/laboratory', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Collect sample
    collectSample: async (id) => {
        return apiRequest(`/laboratory/${id}/collect-sample`, {
            method: 'PUT',
        });
    },

    // Enter results
    enterResults: async (id, data) => {
        return apiRequest(`/laboratory/${id}/enter-results`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Verify results
    verifyResults: async (id) => {
        return apiRequest(`/laboratory/${id}/verify-results`, {
            method: 'PUT',
        });
    },

    // Get pending tests
    getPending: async () => {
        return apiRequest('/laboratory/pending');
    },

    // Get patient lab results
    getPatientResults: async (patientId) => {
        return apiRequest(`/laboratory/patient/${patientId}`);
    },
};

// ===== BILLING API =====
const billingAPI = {
    // Get all invoices
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing?${query}`);
    },

    // Get single invoice
    get: async (id) => {
        return apiRequest(`/billing/${id}`);
    },

    // Create invoice
    create: async (data) => {
        return apiRequest('/billing', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Process payment
    pay: async (id, data) => {
        return apiRequest(`/billing/${id}/pay`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Get patient invoices
    getPatientInvoices: async (patientId) => {
        return apiRequest(`/billing/patient/${patientId}`);
    },

    // Get outstanding balances
    getOutstanding: async () => {
        return apiRequest('/billing/outstanding');
    },

    // Get revenue reports
    getRevenue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing/revenue?${query}`);
    },
};

// ===== DEPARTMENT API =====
const departmentAPI = {
    // Get all departments
    getAll: async () => {
        return apiRequest('/departments');
    },

    // Get single department
    get: async (id) => {
        return apiRequest(`/departments/${id}`);
    },

    // Get active departments
    getActive: async () => {
        return apiRequest('/departments/active');
    },

    // Get department staff
    getStaff: async (id) => {
        return apiRequest(`/departments/${id}/staff`);
    },

    // Get department services
    getServices: async (id) => {
        return apiRequest(`/departments/${id}/services`);
    },
};

// ===== TESTIMONIAL API =====
const testimonialAPI = {
    // Get all testimonials
    getAll: async () => {
        return apiRequest('/testimonials');
    },

    // Get approved testimonials
    getApproved: async () => {
        return apiRequest('/testimonials/approved');
    },

    // Get featured testimonials
    getFeatured: async () => {
        return apiRequest('/testimonials/featured');
    },

    // Create testimonial
    create: async (data) => {
        return apiRequest('/testimonials', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ===== NOTIFICATION API =====
const notificationAPI = {
    // Get all notifications
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/notifications?${query}`);
    },

    // Mark as read
    markAsRead: async (id) => {
        return apiRequest(`/notifications/${id}`, {
            method: 'PUT',
        });
    },

    // Mark all as read
    markAllAsRead: async () => {
        return apiRequest('/notifications/mark-all-read', {
            method: 'PUT',
        });
    },

    // Get unread count
    getUnreadCount: async () => {
        return apiRequest('/notifications/unread-count');
    },

    // Delete notification
    delete: async (id) => {
        return apiRequest(`/notifications/${id}`, {
            method: 'DELETE',
        });
    },
};

// ===== BED API =====
const bedAPI = {
    // Get all beds
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/beds?${query}`);
    },

    // Get available beds
    getAvailable: async () => {
        return apiRequest('/beds/available');
    },

    // Get occupied beds
    getOccupied: async () => {
        return apiRequest('/beds/occupied');
    },

    // Get bed stats
    getStats: async () => {
        return apiRequest('/beds/stats');
    },

    // Assign bed
    assign: async (bedId, patientId) => {
        return apiRequest(`/beds/${bedId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ patientId }),
        });
    },

    // Discharge bed
    discharge: async (bedId) => {
        return apiRequest(`/beds/${bedId}/discharge`, {
            method: 'PUT',
        });
    },
};

// ===== STAFF API =====
const staffAPI = {
    // Get all staff
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/staff?${query}`);
    },

    // Get staff by department
    getByDepartment: async (department) => {
        return apiRequest(`/staff/department/${department}`);
    },

    // Get staff by position
    getByPosition: async (position) => {
        return apiRequest(`/staff/position/${position}`);
    },
};

// ===== REPORTS API =====
const reportsAPI = {
    // Get patient statistics
    getPatientStats: async () => {
        return apiRequest('/reports/patients');
    },

    // Get doctor statistics
    getDoctorStats: async () => {
        return apiRequest('/reports/doctors');
    },

    // Get department statistics
    getDepartmentStats: async () => {
        return apiRequest('/reports/departments');
    },

    // Get admissions report
    getAdmissions: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reports/admissions?${query}`);
    },

    // Get bed occupancy
    getBedOccupancy: async () => {
        return apiRequest('/reports/bed-occupancy');
    },

    // Get revenue report
    getRevenue: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reports/revenue?${query}`);
    },

    // Get financial analytics
    getFinancial: async () => {
        return apiRequest('/reports/financial');
    },

    // Get medical analytics
    getMedical: async () => {
        return apiRequest('/reports/medical');
    },
};

// Export all APIs
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
