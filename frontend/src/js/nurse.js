/**
 * Nurse Dashboard Module
 * Handles nurse-specific functionality
 */

import API from './api.js';
import { formatDate, formatTime, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('nurseStats');
const patientsList = document.getElementById('patientsList');
const vitalsForm = document.getElementById('vitalsForm');
const medicationForm = document.getElementById('medicationForm');

// ===== DASHBOARD =====
export async function loadNurseDashboard() {
    try {
        const response = await API.beds.getStats();
        if (response.success && statsContainer) {
            updateStats(response.data);
        }
        
        // Load assigned patients
        await loadAssignedPatients();
    } catch (error) {
        console.error('Error loading nurse dashboard:', error);
    }
}

function updateStats(data) {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-users"></i></div>
            <div class="stat-card__number">${data.assignedPatients || 0}</div>
            <div class="stat-card__label">Assigned Patients</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-bed"></i></div>
            <div class="stat-card__number">${data.totalBeds || 0}</div>
            <div class="stat-card__label">Total Beds</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-heartbeat"></i></div>
            <div class="stat-card__number">${data.pendingVitals || 0}</div>
            <div class="stat-card__label">Pending Vitals</div>
        </div>
    `;
}

// ===== ASSIGNED PATIENTS =====
export async function loadAssignedPatients() {
    try {
        const response = await API.beds.getOccupied();
        if (response.success && patientsList) {
            renderPatients(response.data);
        }
    } catch (error) {
        console.error('Error loading assigned patients:', error);
    }
}

function renderPatients(patients) {
    if (!patientsList) return;
    
    if (patients.length === 0) {
        patientsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                No assigned patients
            </div>
        `;
        return;
    }
    
    patientsList.innerHTML = patients.map(patient => `
        <div class="patient-card patient-card--${patient.status === 'Urgent' ? 'urgent' : 'stable'}">
            <div class="name">${patient.patient?.fullName || 'Unknown Patient'}</div>
            <div class="details">Room: ${patient.room || 'N/A'} | Bed: ${patient.bedNumber || 'N/A'}</div>
            <div class="vitals">
                <div class="item">
                    <div class="value">${patient.vitals?.bp || '--'}</div>
                    <div class="label">BP</div>
                </div>
                <div class="item">
                    <div class="value">${patient.vitals?.hr || '--'}</div>
                    <div class="label">HR</div>
                </div>
                <div class="item">
                    <div class="value">${patient.vitals?.temp || '--'}°C</div>
                    <div class="label">Temp</div>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn--primary btn--small" onclick="recordVitals('${patient._id}')">
                    <i class="fas fa-heartbeat"></i> Vitals
                </button>
                <button class="btn btn--outline btn--small" onclick="viewPatient('${patient._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `).join('');
}

// ===== VITALS =====
export async function recordVitals(patientId) {
    try {
        window.location.href = `/pages/nurse/vitals.html?patientId=${patientId}`;
    } catch (error) {
        console.error('Error recording vitals:', error);
    }
}

export async function saveVitals(data) {
    try {
        // This would call the vitals API
        console.log('Saving vitals:', data);
        showToast('Vitals recorded successfully', 'success');
        if (vitalsForm) vitalsForm.reset();
    } catch (error) {
        console.error('Error saving vitals:', error);
        showToast('Error recording vitals', 'error');
    }
}

// ===== MEDICATIONS =====
export async function administerMedication(data) {
    try {
        // This would call the medication API
        console.log('Administering medication:', data);
        showToast('Medication administered successfully', 'success');
        if (medicationForm) medicationForm.reset();
    } catch (error) {
        console.error('Error administering medication:', error);
        showToast('Error administering medication', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.recordVitals = recordVitals;
window.viewPatient = (id) => window.location.href = `/pages/nurse/patient-detail.html?id=${id}`;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Vitals form
    if (vitalsForm) {
        vitalsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(vitalsForm);
            await saveVitals(Object.fromEntries(formData));
        });
    }
    
    // Medication form
    if (medicationForm) {
        medicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(medicationForm);
            await administerMedication(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.nurse-dashboard')) {
        loadNurseDashboard();
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
