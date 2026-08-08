/**
 * Doctor Dashboard Module
 * Handles doctor-specific functionality
 */

import API from './api.js';
import { formatDate, formatTime, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('doctorStats');
const appointmentsList = document.getElementById('appointmentsList');
const patientsList = document.getElementById('patientsList');
const consultationForm = document.getElementById('consultationForm');
const prescriptionForm = document.getElementById('prescriptionForm');
const labRequestForm = document.getElementById('labRequestForm');

// ===== DASHBOARD =====
export async function loadDoctorDashboard() {
    try {
        const response = await API.doctors.getAppointments(API.getCurrentUser()?._id || '');
        if (response.success) {
            updateStats(response.data);
            renderAppointments(response.data);
        }
    } catch (error) {
        console.error('Error loading doctor dashboard:', error);
    }
}

function updateStats(data) {
    if (!statsContainer) return;
    
    const today = new Date().toDateString();
    const todayApps = data.filter(app => new Date(app.date).toDateString() === today);
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-card__number">${todayApps.length}</div>
            <div class="stat-card__label">Today's Appointments</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-users"></i></div>
            <div class="stat-card__number">${data.length}</div>
            <div class="stat-card__label">Total Appointments</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-clock"></i></div>
            <div class="stat-card__number">${data.filter(a => a.status === 'Scheduled').length}</div>
            <div class="stat-card__label">Pending</div>
        </div>
    `;
}

// ===== APPOINTMENTS =====
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
        <div class="appointment-card appointment-card--${app.priority?.toLowerCase() || 'normal'}">
            <div class="info">
                <div class="patient">${app.patient?.fullName || 'Unknown Patient'}</div>
                <div class="time">${formatDate(app.date)} at ${formatTime(app.time)}</div>
                <div class="type">${app.type || 'Consultation'}</div>
                <span class="status">${getStatusBadge(app.status)}</span>
            </div>
            <div class="actions">
                <button class="btn btn--primary btn--small" onclick="startConsultation('${app._id}')">
                    <i class="fas fa-stethoscope"></i> Start
                </button>
                <button class="btn btn--outline btn--small" onclick="viewPatient('${app.patient?._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `).join('');
}

// ===== CONSULTATION =====
export async function startConsultation(appointmentId) {
    try {
        window.location.href = `/pages/doctor/consultation.html?id=${appointmentId}`;
    } catch (error) {
        console.error('Error starting consultation:', error);
    }
}

export async function saveConsultation(data) {
    try {
        // This would call the consultation API
        // For now, just log
        console.log('Saving consultation:', data);
        showToast('Consultation saved successfully', 'success');
    } catch (error) {
        console.error('Error saving consultation:', error);
        showToast('Error saving consultation', 'error');
    }
}

// ===== PRESCRIPTIONS =====
export async function createPrescription(data) {
    try {
        const response = await API.pharmacy.create(data);
        if (response.success) {
            showToast('Prescription created successfully', 'success');
            if (prescriptionForm) prescriptionForm.reset();
        }
    } catch (error) {
        console.error('Error creating prescription:', error);
        showToast('Error creating prescription', 'error');
    }
}

// ===== LAB REQUESTS =====
export async function createLabRequest(data) {
    try {
        const response = await API.laboratory.create(data);
        if (response.success) {
            showToast('Lab request submitted successfully', 'success');
            if (labRequestForm) labRequestForm.reset();
        }
    } catch (error) {
        console.error('Error creating lab request:', error);
        showToast('Error creating lab request', 'error');
    }
}

// ===== PATIENTS =====
export async function loadDoctorPatients() {
    try {
        const response = await API.doctors.getPatients(API.getCurrentUser()?._id || '');
        if (response.success && patientsList) {
            renderPatients(response.data);
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

function renderPatients(patients) {
    if (!patientsList) return;
    
    if (patients.length === 0) {
        patientsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No patients assigned
            </div>
        `;
        return;
    }
    
    patientsList.innerHTML = patients.map(patient => `
        <div class="patient-card">
            <div class="name">${patient.fullName}</div>
            <div class="details">${patient.patientId} | ${patient.phone || 'N/A'}</div>
            <div class="actions">
                <button class="btn btn--primary btn--small" onclick="viewPatient('${patient._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn--outline btn--small" onclick="viewHistory('${patient._id}')">
                    <i class="fas fa-history"></i> History
                </button>
            </div>
        </div>
    `).join('');
}

// ===== EXPOSE GLOBALLY =====
window.startConsultation = startConsultation;
window.viewPatient = (id) => window.location.href = `/pages/doctor/patient-detail.html?id=${id}`;
window.viewHistory = (id) => window.location.href = `/pages/doctor/patient-history.html?id=${id}`;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Consultation form
    if (consultationForm) {
        consultationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(consultationForm);
            await saveConsultation(Object.fromEntries(formData));
        });
    }
    
    // Prescription form
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(prescriptionForm);
            await createPrescription(Object.fromEntries(formData));
        });
    }
    
    // Lab request form
    if (labRequestForm) {
        labRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(labRequestForm);
            await createLabRequest(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.doctor-dashboard')) {
        loadDoctorDashboard();
    }
    
    if (document.querySelector('.doctor-patients-page')) {
        loadDoctorPatients();
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
