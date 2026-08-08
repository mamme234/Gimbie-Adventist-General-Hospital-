/**
 * Authentication Module
 * Handles login, registration, and session management
 */

import API from './api.js';

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// ===== CHECK AUTH STATUS =====
export const checkAuth = () => {
    const token = API.getToken();
    const user = API.getCurrentUser();
    
    if (token && user) {
        // User is logged in
        updateUI(user);
        return true;
    }
    
    return false;
};

// ===== UPDATE UI =====
const updateUI = (user) => {
    if (userName) {
        userName.textContent = user.fullName || user.name || 'User';
    }
    
    if (userAvatar) {
        const initials = getInitials(user.fullName || user.name || 'U');
        userAvatar.textContent = initials;
    }
    
    // Show/hide elements based on role
    if (userMenu) {
        userMenu.style.display = 'flex';
    }
    
    // Redirect based on role
    const currentPath = window.location.pathname;
    if (currentPath === '/pages/login.html' || currentPath === '/pages/register.html') {
        redirectByRole(user.role);
    }
};

// ===== REDIRECT BY ROLE =====
const redirectByRole = (role) => {
    const roleMap = {
        'super_admin': '/pages/admin/dashboard.html',
        'admin': '/pages/admin/dashboard.html',
        'doctor': '/pages/doctor/dashboard.html',
        'nurse': '/pages/nurse/dashboard.html',
        'pharmacist': '/pages/pharmacy/dashboard.html',
        'lab_technician': '/pages/laboratory/dashboard.html',
        'radiologist': '/pages/radiology/dashboard.html',
        'accountant': '/pages/admin/billing.html',
        'receptionist': '/pages/admin/appointments.html',
        'patient': '/pages/patient/dashboard.html',
    };
    
    const redirectUrl = roleMap[role] || '/';
    window.location.href = redirectUrl;
};

// ===== GET INITIALS =====
const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

// ===== LOGIN =====
export const login = async (email, password) => {
    try {
        const result = await API.auth.login(email, password);
        
        if (result.success) {
            showToast('Login successful!', 'success');
            updateUI(result.user);
            redirectByRole(result.user.role);
        }
        
        return result;
    } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'error');
        throw error;
    }
};

// ===== REGISTER =====
export const register = async (userData) => {
    try {
        const result = await API.auth.register(userData);
        
        if (result.success) {
            showToast('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
        }
        
        return result;
    } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
        throw error;
    }
};

// ===== LOGOUT =====
export const logout = () => {
    API.auth.logout();
    showToast('Logged out successfully', 'success');
    window.location.href = '/';
};

// ===== CHANGE PASSWORD =====
export const changePassword = async (currentPassword, newPassword) => {
    try {
        const result = await API.auth.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            showToast('Password changed successfully!', 'success');
        }
        
        return result;
    } catch (error) {
        showToast(error.message || 'Password change failed.', 'error');
        throw error;
    }
};

// ===== FORGOT PASSWORD =====
export const forgotPassword = async (email) => {
    try {
        const result = await API.auth.forgotPassword(email);
        
        if (result.success) {
            showToast('Password reset link sent to your email.', 'success');
        }
        
        return result;
    } catch (error) {
        showToast(error.message || 'Failed to send reset link.', 'error');
        throw error;
    }
};

// ===== RESET PASSWORD =====
export const resetPassword = async (token, newPassword) => {
    try {
        const result = await API.auth.resetPassword(token, newPassword);
        
        if (result.success) {
            showToast('Password reset successfully! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
        }
        
        return result;
    } catch (error) {
        showToast(error.message || 'Password reset failed.', 'error');
        throw error;
    }
};

// ===== SHOW TOAST =====
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#0f5c2e' : '#c62828'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ===== INITIALIZE =====
export const initAuth = () => {
    // Check auth on page load
    const isLoggedIn = checkAuth();
    
    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
    
    // Register form handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                role: formData.get('role') || 'patient',
            };
            await register(userData);
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
};

// ===== AUTO-INIT =====
document.addEventListener('DOMContentLoaded', initAuth);
