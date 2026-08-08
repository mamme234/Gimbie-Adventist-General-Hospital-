/**
 * Patient Dashboard Module
 * Handles patient-specific functionality
 */

import API from './api.js';
import { formatDate, formatTime, formatCurrency, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('patientStats');
const appointmentsList = document.getElementById('appointmentsList');
const medicalRecordsContainer = document.getElementById('medicalRecords');
const labResultsContainer = document.getElementById('labResults');
const prescriptionsContainer = document.getElementById('prescriptions');
const billingContainer = document.getElementById('billingContainer');
const profileForm = document.getElementById('profileForm');

// ===== DASHBOARD =====
export async function loadPatientDashboard() {
    try {
        const user = API.getCurrentUser();
        if (!user) return;
        
        // Get patient data
        const response = await API.patients.get(user.id);
        if (response.success) {
            const patient = response.data;
            updateStats(patient);
            loadAppointments(patient._id);
            loadMedicalRecords(patient._id);
        }
    } catch (error) {
        console.error('Error loading patient dashboard:', error);
    }
}

function updateStats(patient) {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-card__number">${patient.upcomingAppointments || 0}</div>
            <div class="stat-card__label">Upcoming Appointments</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-file-medical"></i></div>
            <div class="stat-card__number">${patient.totalRecords || 0}</div>
            <div class="stat-card__label">Medical Records</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-prescription"></i></div>
            <div class="stat-card__number">${patient.activePrescriptions || 0}</div>
            <div class="stat-card__label">Active Prescriptions</div>
        </div>
        <div class="stat-card stat-card--red">
            <div class="stat-card__icon"><i class="fas fa-money-bill"></i></div>
            <div class="stat-card__number">${formatCurrency(patient.outstandingBalance || 0)}</div>
            <div class="stat-card__label">Outstanding Balance</div>
        </div>
    `;
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
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-calendar" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No appointments scheduled
            </div>
        `;
        return;
    }
    
    appointmentsList.innerHTML = appointments.map(app => `
        <div class="appointment-item">
            <div class="info">
                <div class="doctor">${app.doctor?.userId?.fullName || 'Doctor'}</div>
                <div class="date-time">${formatDate(app.date)} at ${formatTime(app.time)}</div>
                <div class="department">${app.department || 'General'}</div>
            </div>
            <span class="status status--${app.status.toLowerCase()}">${app.status}</span>
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
    
    if (!records || records.length === 0) {
        medicalRecordsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-file-medical" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No medical records found
            </div>
        `;
        return;
    }
    
    medicalRecordsContainer.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="icon"><i class="fas fa-file-medical-alt"></i></div>
            <div class="info">
                <div class="title">${record.diagnosis || 'Medical Record'}</div>
                <div class="date">${formatDate(record.date)}</div>
            </div>
        </div>
    `).join('');
}

// ===== LAB RESULTS =====
export async function loadLabResults(patientId) {
    try {
        const response = await API.patients.getLabResults(patientId);
        if (response.success && labResultsContainer) {
            renderLabResults(response.data);
        }
    } catch (error) {
        console.error('Error loading lab results:', error);
    }
}

function renderLabResults(results) {
    if (!labResultsContainer) return;
    
    if (!results || results.length === 0) {
        labResultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-microscope" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No lab results found
            </div>
        `;
        return;
    }
    
    labResultsContainer.innerHTML = results.map(result => `
        <div class="record-item">
            <div class="icon"><i class="fas fa-flask"></i></div>
            <div class="info">
                <div class="title">${result.testName}</div>
                <div class="date">${formatDate(result.createdAt)}</div>
                <span class="badge">${result.status}</span>
            </div>
        </div>
    `).join('');
}

// ===== PRESCRIPTIONS =====
export async function loadPrescriptions(patientId) {
    try {
        // This would call the prescriptions API
        if (prescriptionsContainer) {
            prescriptionsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-prescription" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No prescriptions found
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading prescriptions:', error);
    }
}

// ===== BILLING =====
export async function loadBilling(patientId) {
    try {
        const response = await API.patients.getBills(patientId);
        if (response.success && billingContainer) {
            renderBilling(response.data);
        }
    } catch (error) {
        console.error('Error loading billing:', error);
    }
}

function renderBilling(bills) {
    if (!billingContainer) return;
    
    if (!bills || bills.length === 0) {
        billingContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-file-invoice" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No bills found
            </div>
        `;
        return;
    }
    
    billingContainer.innerHTML = bills.map(bill => `
        <div class="record-item">
            <div class="icon"><i class="fas fa-file-invoice-dollar"></i></div>
            <div class="info">
                <div class="title">${bill.invoiceNumber}</div>
                <div class="date">${formatCurrency(bill.total)}</div>
                <span class="badge">${bill.status}</span>
            </div>
        </div>
    `).join('');
}

// ===== PROFILE =====
export async function updateProfile(data) {
    try {
        const response = await API.auth.updateProfile(data);
        if (response.success) {
            showToast('Profile updated successfully', 'success');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile', 'error');
    }
}

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Profile form
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            await updateProfile(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.patient-dashboard')) {
        loadPatientDashboard();
    }
    
    if (document.querySelector('.patient-lab-results')) {
        const user = API.getCurrentUser();
        if (user) loadLabResults(user.id);
    }
    
    if (document.querySelector('.patient-billing')) {
        const user = API.getCurrentUser();
        if (user) loadBilling(user.id);
    }
});

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
