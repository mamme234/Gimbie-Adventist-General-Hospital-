/**
 * Pharmacy Module
 * Handles pharmacy-specific functionality
 */

import API from './api.js';
import { formatDate, formatCurrency, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('pharmacyStats');
const medicationsTable = document.getElementById('medicationsTable');
const stockAlertContainer = document.getElementById('stockAlerts');
const prescriptionQueueContainer = document.getElementById('prescriptionQueue');
const medicationForm = document.getElementById('medicationForm');

// ===== DASHBOARD =====
export async function loadPharmacyDashboard() {
    try {
        const [medications, lowStock, expiring] = await Promise.all([
            API.pharmacy.getAll(),
            API.pharmacy.getLowStock(),
            API.pharmacy.getExpiring()
        ]);
        
        if (statsContainer) {
            updateStats(medications.data, lowStock.data, expiring.data);
        }
        
        if (stockAlertContainer) {
            renderStockAlerts(lowStock.data, expiring.data);
        }
        
        if (prescriptionQueueContainer) {
            loadPrescriptionQueue();
        }
    } catch (error) {
        console.error('Error loading pharmacy dashboard:', error);
    }
}

function updateStats(medications, lowStock, expiring) {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-pills"></i></div>
            <div class="stat-card__number">${medications?.length || 0}</div>
            <div class="stat-card__label">Total Medications</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-card__number">${lowStock?.length || 0}</div>
            <div class="stat-card__label">Low Stock</div>
        </div>
        <div class="stat-card stat-card--red">
            <div class="stat-card__icon"><i class="fas fa-clock"></i></div>
            <div class="stat-card__number">${expiring?.length || 0}</div>
            <div class="stat-card__label">Expiring Soon</div>
        </div>
    `;
}

// ===== STOCK ALERTS =====
function renderStockAlerts(lowStock, expiring) {
    if (!stockAlertContainer) return;
    
    const alerts = [];
    
    if (lowStock && lowStock.length > 0) {
        lowStock.forEach(med => {
            alerts.push(`
                <div style="background: #fff3e0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid var(--warning); margin-bottom: 8px;">
                    <strong>${med.name}</strong> - Low Stock: ${med.stockQuantity} units remaining
                    <span style="float: right;">
                        <button class="btn btn--small btn--primary" onclick="restockMedication('${med._id}')">Restock</button>
                    </span>
                </div>
            `);
        });
    }
    
    if (expiring && expiring.length > 0) {
        expiring.forEach(med => {
            alerts.push(`
                <div style="background: #ffebee; padding: 12px 16px; border-radius: 8px; border-left: 4px solid var(--danger); margin-bottom: 8px;">
                    <strong>${med.name}</strong> - Expires on ${formatDate(med.expiryDate)}
                </div>
            `);
        });
    }
    
    stockAlertContainer.innerHTML = alerts.length > 0 ? alerts.join('') : `
        <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
            <i class="fas fa-check-circle" style="color: var(--primary);"></i> All stocks are healthy
        </div>
    `;
}

// ===== PRESCRIPTION QUEUE =====
export async function loadPrescriptionQueue() {
    try {
        const response = await API.pharmacy.getPrescriptionQueue?.() || { success: false };
        if (response.success && prescriptionQueueContainer) {
            renderPrescriptionQueue(response.data);
        }
    } catch (error) {
        console.error('Error loading prescription queue:', error);
    }
}

function renderPrescriptionQueue(prescriptions) {
    if (!prescriptionQueueContainer) return;
    
    if (!prescriptions || prescriptions.length === 0) {
        prescriptionQueueContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> No pending prescriptions
            </div>
        `;
        return;
    }
    
    prescriptionQueueContainer.innerHTML = prescriptions.map(pres => `
        <div class="prescription-item">
            <div>
                <div class="patient">${pres.patient?.fullName || 'Unknown Patient'}</div>
                <div class="medication">${pres.medication || 'N/A'}</div>
            </div>
            <div>
                <span class="status status--${pres.status?.toLowerCase()}">${pres.status || 'Pending'}</span>
                <button class="btn btn--small btn--primary" onclick="dispensePrescription('${pres._id}')">Dispense</button>
            </div>
        </div>
    `).join('');
}

// ===== MEDICATIONS =====
export async function loadMedications() {
    try {
        const response = await API.pharmacy.getAll();
        if (response.success && medicationsTable) {
            renderMedications(response.data);
        }
    } catch (error) {
        console.error('Error loading medications:', error);
    }
}

function renderMedications(medications) {
    if (!medicationsTable) return;
    
    if (medications.length === 0) {
        medicationsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-pills" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No medications found
                </td>
            </tr>
        `;
        return;
    }
    
    medicationsTable.innerHTML = medications.map(med => `
        <tr>
            <td>${med.medicationId}</td>
            <td>${med.name}</td>
            <td>${med.category}</td>
            <td>${med.form}</td>
            <td>${med.stockQuantity}</td>
            <td>${formatCurrency(med.sellingPrice)}</td>
            <td>${getStatusBadge(med.stockQuantity <= med.reorderLevel ? 'Low Stock' : 'In Stock')}</td>
            <td>
                <button class="action-btn" onclick="editMedication('${med._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteMedication('${med._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== MEDICATION CRUD =====
export async function createMedication(data) {
    try {
        const response = await API.pharmacy.create(data);
        if (response.success) {
            showToast('Medication created successfully', 'success');
            if (medicationForm) medicationForm.reset();
            loadMedications();
        }
    } catch (error) {
        console.error('Error creating medication:', error);
        showToast('Error creating medication', 'error');
    }
}

export async function updateMedication(id, data) {
    try {
        const response = await API.pharmacy.update(id, data);
        if (response.success) {
            showToast('Medication updated successfully', 'success');
            loadMedications();
        }
    } catch (error) {
        console.error('Error updating medication:', error);
        showToast('Error updating medication', 'error');
    }
}

export async function deleteMedication(id) {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    
    try {
        const response = await API.pharmacy.delete(id);
        if (response.success) {
            showToast('Medication deleted successfully', 'success');
            loadMedications();
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        showToast('Error deleting medication', 'error');
    }
}

export async function dispensePrescription(id) {
    try {
        const response = await API.pharmacy.dispense(id);
        if (response.success) {
            showToast('Prescription dispensed successfully', 'success');
            loadPrescriptionQueue();
        }
    } catch (error) {
        console.error('Error dispensing prescription:', error);
        showToast('Error dispensing prescription', 'error');
    }
}

export async function restockMedication(id) {
    const quantity = prompt('Enter quantity to restock:');
    if (!quantity) return;
    
    try {
        const response = await API.pharmacy.restock(id, { quantity: parseInt(quantity) });
        if (response.success) {
            showToast('Medication restocked successfully', 'success');
            loadPharmacyDashboard();
        }
    } catch (error) {
        console.error('Error restocking medication:', error);
        showToast('Error restocking medication', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.editMedication = (id) => window.location.href = `/pages/pharmacy/medication-edit.html?id=${id}`;
window.deleteMedication = deleteMedication;
window.dispensePrescription = dispensePrescription;
window.restockMedication = restockMedication;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Medication form
    if (medicationForm) {
        medicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(medicationForm);
            await createMedication(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.pharmacy-dashboard')) {
        loadPharmacyDashboard();
    }
    
    if (document.querySelector('.pharmacy-medications')) {
        loadMedications();
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
