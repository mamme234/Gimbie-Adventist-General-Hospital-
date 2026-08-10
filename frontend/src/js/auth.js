// src/js/auth.js
import { API_BASE_URL } from './config.js';

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// ===== SHOW TOAST =====
function showToast(message, type = 'error') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
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
        background: ${type === 'success' ? '#0f5c2e' : '#c62828'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== LOGIN =====
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const role = document.querySelector('input[name="role"]:checked')?.value || 'patient';
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // Show loading
    if (loginBtn) {
        loginBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'block';
    }

    try {
        console.log('🔐 Attempting login for:', email);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();
        console.log('📦 Login response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.success && data.token) {
            // Save token and user
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            showToast('✅ Login successful!', 'success');

            // Redirect based on role
            setTimeout(() => {
                const user = data.user;
                if (user.role === 'admin') {
                    window.location.href = '/pages/admin/dashboard.html';
                } else if (user.role === 'doctor') {
                    window.location.href = '/pages/doctor/dashboard.html';
                } else if (user.role === 'nurse') {
                    window.location.href = '/pages/nurse/dashboard.html';
                } else {
                    window.location.href = '/pages/patient/dashboard.html';
                }
            }, 1500);
        } else {
            throw new Error(data.message || 'Invalid credentials');
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        showToast(error.message || 'Failed to login. Please try again.', 'error');
        
        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-flex';
            if (btnSpinner) btnSpinner.style.display = 'none';
        }
    }
}

// ===== REGISTER =====
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const phone = document.getElementById('phone')?.value;
    const role = document.getElementById('role')?.value || 'patient';

    if (!fullName || !email || !password || !phone) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    const registerBtn = document.getElementById('registerBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // Show loading
    if (registerBtn) {
        registerBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'block';
    }

    try {
        console.log('📝 Attempting registration for:', email);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                fullName, 
                email, 
                password, 
                phone,
                role,
                isActive: true 
            })
        });

        const data = await response.json();
        console.log('📦 Register response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        if (data.success) {
            showToast('✅ Registration successful! Please login.', 'success');
            
            // Reset form
            if (registerForm) registerForm.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
        } else {
            throw new Error(data.message || 'Registration failed');
        }

    } catch (error) {
        console.error('❌ Register error:', error);
        showToast(error.message || 'Failed to register. Please try again.', 'error');
        
        // Reset button
        if (registerBtn) {
            registerBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline-flex';
            if (btnSpinner) btnSpinner.style.display = 'none';
        }
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Auth page loaded');
    console.log('📡 API URL:', API_BASE_URL);

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Auto-fill remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = rememberedEmail;
    }
});

// ===== EXPORT =====
export { handleLogin, handleRegister };
