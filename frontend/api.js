/**
 * ============================================
 * API.JS - API Service Layer
 * Connects frontend to backend API
 * ============================================
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'https://alpha-af1q.onrender.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Token management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * Get stored token
 */
const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Get stored refresh token
 */
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/**
 * Set tokens in localStorage
 */
const setTokens = (token, refreshToken) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Clear tokens from localStorage
 */
const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get stored user data
 */
const getStoredUser = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

/**
 * Set user data in localStorage
 */
const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  return !!getToken();
};

/**
 * API request function with authentication
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const token = getToken();

  const headers = {
    ...API_CONFIG.headers,
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    timeout: API_CONFIG.timeout
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Handle token expiration
    if (response.status === 401 && data.message?.includes('token expired')) {
      // Try to refresh token
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        // Retry the request with new token
        return apiRequest(endpoint, options);
      }
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'API request failed',
        errors: data.errors || []
      };
    }

    return data;
  } catch (error) {
    if (error.status === 401) {
      // Unauthorized - clear tokens and redirect to login
      clearTokens();
      window.location.href = '/login.html';
    }
    throw error;
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_CONFIG.baseURL}/auth/refresh-token`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setTokens(data.token, data.refreshToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// ============================================
// API METHODS
// ============================================

/**
 * AUTHENTICATION API
 */
const AuthAPI = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success) {
      setTokens(response.token, response.refreshToken);
      setStoredUser(response.user);
    }

    return response;
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success) {
      setTokens(response.token, response.refreshToken);
      setStoredUser(response.user);
    }

    return response;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      window.location.href = '/login.html';
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    if (response.success) {
      setStoredUser(response.user);
    }

    return response;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }
};

/**
 * PATIENT API
 */
const PatientAPI = {
  /**
   * Get all patients (Admin/Doctor only)
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patients?${query}`);
  },

  /**
   * Get patient by ID
   */
  getById: async (id) => {
    return apiRequest(`/patients/${id}`);
  },

  /**
   * Get current patient's profile
   */
  getMyProfile: async () => {
    return apiRequest('/patients/me');
  },

  /**
   * Create new patient (Admin only)
   */
  create: async (patientData) => {
    return apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
  },

  /**
   * Update patient
   */
  update: async (id, patientData) => {
    return apiRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    });
  },

  /**
   * Get patient's medical records
   */
  getMedicalRecords: async (id) => {
    return apiRequest(`/patients/${id}/medical-records`);
  },

  /**
   * Get patient's appointments
   */
  getAppointments: async (id) => {
    return apiRequest(`/patients/${id}/appointments`);
  },

  /**
   * Get patient's bills
   */
  getBills: async (id) => {
    return apiRequest(`/patients/${id}/bills`);
  }
};

/**
 * DOCTOR API
 */
const DoctorAPI = {
  /**
   * Get all doctors
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/doctors?${query}`);
  },

  /**
   * Get doctor by ID
   */
  getById: async (id) => {
    return apiRequest(`/doctors/${id}`);
  },

  /**
   * Get current doctor's profile
   */
  getMyProfile: async () => {
    return apiRequest('/doctors/me');
  },

  /**
   * Get doctor's patients
   */
  getPatients: async () => {
    return apiRequest('/doctors/patients');
  },

  /**
   * Get doctor's appointments
   */
  getAppointments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/doctors/appointments?${query}`);
  },

  /**
   * Get doctor's schedule
   */
  getSchedule: async () => {
    return apiRequest('/doctors/schedule');
  },

  /**
   * Update doctor availability
   */
  updateAvailability: async (availability) => {
    return apiRequest('/doctors/availability', {
      method: 'PUT',
      body: JSON.stringify({ availability })
    });
  }
};

/**
 * APPOINTMENT API
 */
const AppointmentAPI = {
  /**
   * Get all appointments
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/appointments?${query}`);
  },

  /**
   * Get appointment by ID
   */
  getById: async (id) => {
    return apiRequest(`/appointments/${id}`);
  },

  /**
   * Create appointment
   */
  create: async (appointmentData) => {
    return apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  },

  /**
   * Update appointment
   */
  update: async (id, appointmentData) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData)
    });
  },

  /**
   * Cancel appointment
   */
  cancel: async (id) => {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'PUT'
    });
  },

  /**
   * Complete appointment
   */
  complete: async (id, data) => {
    return apiRequest(`/appointments/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Get available time slots
   */
  getAvailableSlots: async (doctorId, date) => {
    return apiRequest(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
  }
};

/**
 * DEPARTMENT API
 */
const DepartmentAPI = {
  /**
   * Get all departments
   */
  getAll: async () => {
    return apiRequest('/departments');
  },

  /**
   * Get department by ID
   */
  getById: async (id) => {
    return apiRequest(`/departments/${id}`);
  },

  /**
   * Create department (Admin only)
   */
  create: async (departmentData) => {
    return apiRequest('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData)
    });
  },

  /**
   * Update department (Admin only)
   */
  update: async (id, departmentData) => {
    return apiRequest(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData)
    });
  },

  /**
   * Get department doctors
   */
  getDoctors: async (id) => {
    return apiRequest(`/departments/${id}/doctors`);
  }
};

/**
 * PRESCRIPTION API
 */
const PrescriptionAPI = {
  /**
   * Get all prescriptions
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/prescriptions?${query}`);
  },

  /**
   * Get prescription by ID
   */
  getById: async (id) => {
    return apiRequest(`/prescriptions/${id}`);
  },

  /**
   * Create prescription
   */
  create: async (prescriptionData) => {
    return apiRequest('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData)
    });
  },

  /**
   * Update prescription
   */
  update: async (id, prescriptionData) => {
    return apiRequest(`/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prescriptionData)
    });
  },

  /**
   * Get patient's prescriptions
   */
  getPatientPrescriptions: async (patientId) => {
    return apiRequest(`/prescriptions/patient/${patientId}`);
  }
};

/**
 * BILLING API
 */
const BillingAPI = {
  /**
   * Get all bills
   */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/billing?${query}`);
  },

  /**
   * Get bill by ID
   */
  getById: async (id) => {
    return apiRequest(`/billing/${id}`);
  },

  /**
   * Create bill
   */
  create: async (billData) => {
    return apiRequest('/billing', {
      method: 'POST',
      body: JSON.stringify(billData)
    });
  },

  /**
   * Update bill
   */
  update: async (id, billData) => {
    return apiRequest(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData)
    });
  },

  /**
   * Record payment
   */
  recordPayment: async (id, paymentData) => {
    return apiRequest(`/billing/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  /**
   * Get patient's bills
   */
  getPatientBills: async (patientId) => {
    return apiRequest(`/billing/patient/${patientId}`);
  }
};

/**
 * ADMIN API
 */
const AdminAPI = {
  /**
   * Get system stats
   */
  getStats: async () => {
    return apiRequest('/admin/stats');
  },

  /**
   * Get all users
   */
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${query}`);
  },

  /**
   * Update user
   */
  updateUser: async (id, userData) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  /**
   * Delete user
   */
  deleteUser: async (id) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get system logs
   */
  getLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/logs?${query}`);
  },

  /**
   * Create backup
   */
  createBackup: async () => {
    return apiRequest('/admin/backup', {
      method: 'POST'
    });
  }
};

// ============================================
// EXPORTS
// ============================================

const API = {
  // Configuration
  config: API_CONFIG,
  getToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getStoredUser,
  setStoredUser,
  isAuthenticated,

  // Modules
  auth: AuthAPI,
  patients: PatientAPI,
  doctors: DoctorAPI,
  appointments: AppointmentAPI,
  departments: DepartmentAPI,
  prescriptions: PrescriptionAPI,
  billing: BillingAPI,
  admin: AdminAPI
};

// Make API globally available
window.API = API;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
