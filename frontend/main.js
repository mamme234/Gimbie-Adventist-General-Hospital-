/**
 * ============================================
 * MAIN.JS - Complete Global JavaScript File
 * Adventist General Hospital
 * Version: 2.0 (Backend Connected)
 * ============================================
 */

// ============================================
// DOM Ready - Initialize all modules
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all components
    initMobileMenu();
    initDropdowns();
    initHeaderScroll();
    initCounters();
    initSmoothScroll();
    initFormValidation();
    initPasswordToggle();
    initModals();
    initTabs();
    initTooltips();
    initBackToTop();
    initSearchFilter();
    initToastMessages();
    initAuthCheck();
    initNavAuth();
    initLogoutHandler();
    
    console.log('🏥 Adventist General Hospital - System Ready');
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log(`👤 User: ${getCurrentUser()?.email || 'Not logged in'}`);
});

// ============================================
// ============================================
// AUTHENTICATION & API INTEGRATION
// ============================================
// ============================================

// ============================================
// API Configuration
// ============================================

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
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set tokens in localStorage
 */
function setTokens(token, refreshToken) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens from localStorage
 */
function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Get stored user data
 */
function getStoredUser() {
    try {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
}

/**
 * Set user data in localStorage
 */
function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Get current user
 */
function getCurrentUser() {
    return getStoredUser();
}

/**
 * Get role-based dashboard URL
 */
function getDashboardUrl(role) {
    const dashboards = {
        admin: '/admin/dashboard.html',
        doctor: '/doctor/dashboard.html',
        nurse: '/nurse/dashboard.html',
        patient: '/patient/dashboard.html',
        staff: '/staff/dashboard.html',
        finance: '/finance/dashboard.html',
        hr: '/hr/dashboard.html'
    };
    return dashboards[role] || '/patient/dashboard.html';
}

/**
 * Redirect to appropriate dashboard based on role
 */
function redirectToDashboard() {
    const user = getCurrentUser();
    if (user && user.role) {
        window.location.href = getDashboardUrl(user.role);
    } else {
        window.location.href = '/login.html';
    }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

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
            const refreshSuccess = await refreshAccessToken();
            if (refreshSuccess) {
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

/**
 * Show toast message
 */
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.setAttribute('data-duration', duration);
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// API METHODS
// ============================================

/**
 * AUTHENTICATION API
 */
const AuthAPI = {
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

    getProfile: async () => {
        return apiRequest('/auth/profile');
    },

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

    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    forgotPassword: async (email) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

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
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/patients?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/patients/${id}`);
    },

    getMyProfile: async () => {
        return apiRequest('/patients/me');
    },

    create: async (patientData) => {
        return apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
    },

    update: async (id, patientData) => {
        return apiRequest(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patientData)
        });
    },

    getMedicalRecords: async (id) => {
        return apiRequest(`/patients/${id}/medical-records`);
    },

    getAppointments: async (id) => {
        return apiRequest(`/patients/${id}/appointments`);
    },

    getBills: async (id) => {
        return apiRequest(`/patients/${id}/bills`);
    }
};

/**
 * DOCTOR API
 */
const DoctorAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/doctors/${id}`);
    },

    getMyProfile: async () => {
        return apiRequest('/doctors/me');
    },

    getPatients: async () => {
        return apiRequest('/doctors/patients');
    },

    getAppointments: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/doctors/appointments?${query}`);
    },

    getSchedule: async () => {
        return apiRequest('/doctors/schedule');
    },

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
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/appointments?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/appointments/${id}`);
    },

    create: async (appointmentData) => {
        return apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
    },

    update: async (id, appointmentData) => {
        return apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(appointmentData)
        });
    },

    cancel: async (id) => {
        return apiRequest(`/appointments/${id}/cancel`, {
            method: 'PUT'
        });
    },

    complete: async (id, data) => {
        return apiRequest(`/appointments/${id}/complete`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getAvailableSlots: async (doctorId, date) => {
        return apiRequest(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);
    }
};

/**
 * DEPARTMENT API
 */
const DepartmentAPI = {
    getAll: async () => {
        return apiRequest('/departments');
    },

    getById: async (id) => {
        return apiRequest(`/departments/${id}`);
    },

    create: async (departmentData) => {
        return apiRequest('/departments', {
            method: 'POST',
            body: JSON.stringify(departmentData)
        });
    },

    update: async (id, departmentData) => {
        return apiRequest(`/departments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(departmentData)
        });
    },

    getDoctors: async (id) => {
        return apiRequest(`/departments/${id}/doctors`);
    }
};

/**
 * PRESCRIPTION API
 */
const PrescriptionAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/prescriptions?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/prescriptions/${id}`);
    },

    create: async (prescriptionData) => {
        return apiRequest('/prescriptions', {
            method: 'POST',
            body: JSON.stringify(prescriptionData)
        });
    },

    update: async (id, prescriptionData) => {
        return apiRequest(`/prescriptions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(prescriptionData)
        });
    },

    getPatientPrescriptions: async (patientId) => {
        return apiRequest(`/prescriptions/patient/${patientId}`);
    }
};

/**
 * BILLING API
 */
const BillingAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/billing?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/billing/${id}`);
    },

    create: async (billData) => {
        return apiRequest('/billing', {
            method: 'POST',
            body: JSON.stringify(billData)
        });
    },

    update: async (id, billData) => {
        return apiRequest(`/billing/${id}`, {
            method: 'PUT',
            body: JSON.stringify(billData)
        });
    },

    recordPayment: async (id, paymentData) => {
        return apiRequest(`/billing/${id}/payment`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    getPatientBills: async (patientId) => {
        return apiRequest(`/billing/patient/${patientId}`);
    }
};

/**
 * ADMIN API
 */
const AdminAPI = {
    getStats: async () => {
        return apiRequest('/admin/stats');
    },

    getUsers: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/admin/users?${query}`);
    },

    updateUser: async (id, userData) => {
        return apiRequest(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    deleteUser: async (id) => {
        return apiRequest(`/admin/users/${id}`, {
            method: 'DELETE'
        });
    },

    getLogs: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/admin/logs?${query}`);
    },

    createBackup: async () => {
        return apiRequest('/admin/backup', {
            method: 'POST'
        });
    }
};

// ============================================
// API Namespace
// ============================================

const API = {
    config: API_CONFIG,
    getToken,
    getRefreshToken,
    setTokens,
    clearTokens,
    getStoredUser,
    setStoredUser,
    isAuthenticated,
    getCurrentUser,
    getDashboardUrl,
    redirectToDashboard,
    requireAuth,
    apiRequest,
    showToast,
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

// ============================================
// ============================================
// UI INITIALIZATION FUNCTIONS
// ============================================
// ============================================

// ============================================
// Mobile Menu Toggle
// ============================================
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const nav = document.getElementById('mainNav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
        
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                if (!nav.contains(e.target) && !toggle.contains(e.target)) {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    }
}

// ============================================
// Dropdowns (Desktop & Mobile)
// ============================================
function initDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 992) {
                const menu = this.querySelector('.dropdown-menu');
                if (menu) {
                    menu.style.opacity = '1';
                    menu.style.visibility = 'visible';
                    menu.style.transform = 'translateY(0)';
                }
            }
        });
        
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 992) {
                const menu = this.querySelector('.dropdown-menu');
                if (menu) {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(10px)';
                }
            }
        });
    });
}

// ============================================
// Header Scroll Effect
// ============================================
function initHeaderScroll() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            if (currentScroll > lastScroll && currentScroll > 300) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }
}

// ============================================
// Counter Animation
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    
    if (counters.length === 0) return;
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                const isPercentage = counter.textContent.includes('%');
                const isCurrency = counter.textContent.includes('ETB');
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        let displayValue = Math.round(current);
                        if (isPercentage) {
                            counter.textContent = displayValue + '%';
                        } else if (isCurrency) {
                            counter.textContent = 'ETB ' + displayValue.toLocaleString();
                        } else {
                            counter.textContent = displayValue;
                        }
                        requestAnimationFrame(updateCounter);
                    } else {
                        if (isPercentage) {
                            counter.textContent = target + '%';
                        } else if (isCurrency) {
                            counter.textContent = 'ETB ' + target.toLocaleString();
                        } else {
                            counter.textContent = target + '+';
                        }
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Form Validation
// ============================================
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = this.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                const errorElement = input.parentElement.querySelector('.error-message');
                const value = input.value.trim();
                
                if (!value) {
                    input.classList.add('error');
                    if (errorElement) errorElement.style.display = 'block';
                    isValid = false;
                } else {
                    input.classList.remove('error');
                    if (errorElement) errorElement.style.display = 'none';
                }
                
                if (input.type === 'email' && value) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(value)) {
                        input.classList.add('error');
                        if (errorElement) {
                            errorElement.textContent = 'Please enter a valid email address';
                            errorElement.style.display = 'block';
                        }
                        isValid = false;
                    }
                }
                
                if (input.type === 'tel' && value) {
                    const phonePattern = /^[\+\d\s\-\(\)]{7,20}$/;
                    if (!phonePattern.test(value)) {
                        input.classList.add('error');
                        if (errorElement) {
                            errorElement.textContent = 'Please enter a valid phone number';
                            errorElement.style.display = 'block';
                        }
                        isValid = false;
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                const firstError = this.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                }
            }
        });
        
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) errorElement.style.display = 'none';
            });
        });
    });
}

// ============================================
// Password Toggle Visibility
// ============================================
function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// ============================================
// Modal Management
// ============================================
function initModals() {
    document.querySelectorAll('[data-modal-open]').forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-open');
            const modal = document.getElementById(modalId);
            if (modal) {
                openModal(modal);
            }
        });
    });
    
    document.querySelectorAll('[data-modal-close]').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal);
            });
        }
    });
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
        focusable[0].focus();
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// Tabs
// ============================================
function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
        const tabs = tabContainer.querySelectorAll('[data-tab]');
        const contents = tabContainer.querySelectorAll('[data-tab-content]');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-tab');
                
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            });
        });
    });
}

// ============================================
// Tooltips
// ============================================
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        const text = element.getAttribute('data-tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        element.appendChild(tooltip);
        
        element.addEventListener('mouseenter', function() {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });
        
        element.addEventListener('mouseleave', function() {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });
    });
}

// ============================================
// Back to Top Button
// ============================================
function initBackToTop() {
    const button = document.getElementById('backToTop');
    if (!button) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    }, { passive: true });
    
    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// Search Filter
// ============================================
function initSearchFilter() {
    document.querySelectorAll('[data-search]').forEach(searchInput => {
        const targetSelector = searchInput.getAttribute('data-search');
        const targetItems = document.querySelectorAll(targetSelector);
        
        if (targetItems.length === 0) return;
        
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            targetItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// Toast Messages
// ============================================
function initToastMessages() {
    document.querySelectorAll('.toast-message').forEach(toast => {
        const duration = parseInt(toast.getAttribute('data-duration')) || 5000;
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, duration);
    });
}

// ============================================
// Authentication Check
// ============================================
function initAuthCheck() {
    // Check if current page requires authentication
    const protectedPages = ['/patient/', '/doctor/', '/nurse/', '/admin/', '/finance/', '/hr/'];
    const currentPath = window.location.pathname;
    const isProtected = protectedPages.some(page => currentPath.includes(page));
    
    if (isProtected) {
        if (!isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }
        
        // Check if user has access to this page
        const user = getCurrentUser();
        if (user) {
            const pageRole = currentPath.split('/')[1]; // patient, doctor, admin, etc.
            if (pageRole && user.role !== pageRole && user.role !== 'admin') {
                window.location.href = getDashboardUrl(user.role);
            }
        }
    }
}

// ============================================
// Navigation Authentication
// ============================================
function initNavAuth() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navMenu) return;
    
    // Remove existing auth links
    const existingAuth = navMenu.querySelector('.auth-link');
    if (existingAuth) existingAuth.remove();
    
    // Remove existing logout link
    const existingLogout = navMenu.querySelector('.logout-link');
    if (existingLogout) existingLogout.remove();
    
    if (isLoggedIn && user) {
        const li = document.createElement('li');
        li.className = 'auth-link';
        li.innerHTML = `
            <a href="${getDashboardUrl(user.role)}" class="user-avatar-link">
                <span class="user-avatar-small">${user.firstName?.[0] || 'U'}</span>
                <span class="user-name">${user.firstName || 'User'}</span>
            </a>
        `;
        navMenu.appendChild(li);
        
        // Add logout link in mobile menu
        if (window.innerWidth <= 992) {
            const logoutLi = document.createElement('li');
            logoutLi.className = 'logout-link';
            logoutLi.innerHTML = `<a href="#" id="mobileLogout"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
            navMenu.appendChild(logoutLi);
            
            document.getElementById('mobileLogout')?.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    } else {
        // Show login/register links
        const loginLi = document.createElement('li');
        loginLi.className = 'auth-link';
        loginLi.innerHTML = `
            <a href="/login.html" class="login-link">Login</a>
            <a href="/register.html" class="register-link btn btn-primary btn-sm" style="margin-left: 10px;">Register</a>
        `;
        navMenu.appendChild(loginLi);
    }
}

// ============================================
// Logout Handler
// ============================================
function initLogoutHandler() {
    // Check if logout button exists in page
    document.querySelectorAll('#logoutBtn, .logout-btn, .sidebar-logout').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}

// ============================================
// Logout Function
// ============================================
function logout() {
    if (window.API && window.API.auth) {
        window.API.auth.logout();
    } else {
        clearTokens();
        window.location.href = '/login.html';
    }
}

// ============================================
// Utility Functions (Global)
// ============================================

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'ETB') {
    return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format date
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);
    const options = {
        short: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
        full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };
    return d.toLocaleDateString('en-US', options[format] || options.short);
}

/**
 * Debounce function
 */
function debounce(func, wait = 250) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/**
 * Validate phone number
 */
function isValidPhone(phone) {
    const pattern = /^[\+\d\s\-\(\)]{7,20}$/;
    return pattern.test(phone);
}

/**
 * Get URL parameters
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Get parameter from URL
 */
function getUrlParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Export for module usage
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API,
        showToast,
        formatCurrency,
        formatDate,
        debounce,
        isValidEmail,
        isValidPhone,
        getUrlParams,
        getUrlParam,
        truncateText,
        escapeHtml,
        openModal,
        closeModal,
        logout,
        isAuthenticated,
        getCurrentUser,
        redirectToDashboard,
        requireAuth
    };
}

// ============================================
// Console Log - System Info
// ============================================
console.log('🏥 Adventist General Hospital - v2.0 (Backend Connected)');
console.log(`📅 ${new Date().toLocaleString()}`);
console.log(`🔗 API URL: ${API_CONFIG.baseURL}`);
console.log(`👤 User: ${getCurrentUser()?.email || 'Not logged in'}`);
console.log(`🔐 Authenticated: ${isAuthenticated() ? '✅ Yes' : '❌ No'}`);
console.log('📦 API Modules Available:', Object.keys(API).filter(k => typeof API[k] === 'object'));
