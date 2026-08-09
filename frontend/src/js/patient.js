/**
 * Patient Dashboard Module
 * Handles patient-specific functionality
 */

import API from './api.js';
import { formatDate, formatTime, formatCurrency } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('patientStats');
const appointmentsList = document.getElementById('appointmentsList');
const medicalRecordsContainer = document.getElementById('medicalRecords');
const logoutBtn = document.getElementById('logoutBtn');

// ===== DASHBOARD =====
export async function loadPatientDashboard() {
    try {
        const user = API.getCurrentUser();
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Update UI with user info
        updateUserInfo(user);

        // Load patient data
        const response = await API.patients.get(user.id);
        if (response.success) {
            const patient = response.data;
            updateStats(patient);
            loadAppointments(patient._id);
            loadMedicalRecords(patient._id);
        }
    } catch (error) {
        console.error('Error loading patient dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function updateUserInfo(user) {
    const name = user.fullName || 'Patient';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    document.getElementById('welcomeName').textContent = name;
    document.getElementById('patientName').textContent = name;
    document.getElementById('userName').textContent = name;
    document.getElementById('patientId').textContent = `ID: ${user.patientId || 'N/A'}`;
    document.getElementById('patientAvatar').textContent = initials;
    document.getElementById('patientAvatarSmall').textContent = initials;

    // Check notifications
    checkNotifications();
}

function updateStats(patient) {
    if (!statsContainer) return;

    const stats = [
        {
            icon: 'fa-calendar-check',
            number: patient.upcomingAppointments || 0,
            label: 'Upcoming Appointments',
            class: ''
        },
        {
            icon: 'fa-file-medical',
            number: patient.totalRecords || 0,
            label: 'Medical Records',
            class: 'stat-card--blue'
        },
        {
            icon: 'fa-prescription-bottle',
            number: patient.activePrescriptions || 0,
            label: 'Active Prescriptions',
            class: 'stat-card--orange'
        },
        {
            icon: 'fa-money-bill-wave',
            number: formatCurrency(patient.outstandingBalance || 0),
            label: 'Outstanding Balance',
            class: 'stat-card--red'
        }
    ];

    statsContainer.innerHTML = stats.map(stat => `
        <div class="stat-card ${stat.class}">
            <div class="stat-card__icon"><i class="fas ${stat.icon}"></i></div>
            <div class="stat-card__number">${stat.number}</div>
            <div class="stat-card__label">${stat.label}</div>
        </div>
    `).join('');
}

// ===== APPOINTMENTS =====
export async function loadAppointments(patientId) {
    try {
        const response = await API.patients.getAppointments(patientId);
        if (response.success && appointmentsList) {
            renderAppointments(response.data);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function renderAppointments(appointments) {
    if (!appointmentsList) return;

    const upcoming = appointments
        .filter(a => a.status === 'Scheduled' || a.status === 'Confirmed')
        .slice(0, 5);

    if (upcoming.length === 0) {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h4>No Upcoming Appointments</h4>
                <p>Book an appointment to get started</p>
                <a href="/pages/appointments.html" class="btn btn--primary btn--small" style="margin-top: 8px;">
                    <i class="fas fa-plus"></i> Book Now
                </a>
            </div>
        `;
        return;
    }

    appointmentsList.innerHTML = upcoming.map(app => `
        <div class="appointment-item">
            <div class="info">
                <div class="doctor">${app.doctor?.userId?.fullName || 'Doctor'}</div>
                <div class="date-time">${formatDate(app.date)} at ${formatTime(app.time)}</div>
                <div class="department">${app.department || 'General'}</div>
            </div>
            <div>
                <span class="status status--${app.status.toLowerCase()}">${app.status}</span>
            </div>
        </div>
    `).join('');
}

// ===== MEDICAL RECORDS =====
export async function loadMedicalRecords(patientId) {
    try {
        const response = await API.patients.getHistory(patientId);
        if (response.success && medicalRecordsContainer) {
            renderMedicalRecords(response.data);
        }
    } catch (error) {
        console.error('Error loading medical records:', error);
    }
}

function renderMedicalRecords(records) {
    if (!medicalRecordsContainer) return;

    const recent = (records || []).slice(0, 5);

    if (recent.length === 0) {
        medicalRecordsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <h4>No Medical Records</h4>
                <p>Your medical records will appear here after your visits</p>
            </div>
        `;
        return;
    }

    medicalRecordsContainer.innerHTML = recent.map(record => `
        <div class="record-item">
            <div class="icon"><i class="fas fa-file-medical-alt"></i></div>
            <div class="info">
                <div class="title">${record.diagnosis || 'Medical Record'}</div>
                <div class="date">${formatDate(record.date)}</div>
                <div class="doctor-name">${record.doctor || 'Doctor'}</div>
            </div>
        </div>
    `).join('');
}

// ===== NOTIFICATIONS =====
async function checkNotifications() {
    try {
        const response = await API.notifications.getUnreadCount();
        if (response.success && response.data.count > 0) {
            document.getElementById('notificationDot').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

// ===== LOGOUT =====
function handleLogout(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        API.setToken(null);
        API.setCurrentUser(null);
        window.location.href = '/pages/login.html';
    }
}

// ===== TOGGLE DROPDOWN =====
function toggleDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

// ===== SHOW TOAST =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
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
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = API.getCurrentUser();
    if (!user) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Load dashboard
    loadPatientDashboard();

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // User profile dropdown toggle
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', toggleDropdown);
    }

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('active');
    });
});

// ===== EXPOSE FOR GLOBAL USE =====
window.loadPatientDashboard = loadPatientDashboard;
