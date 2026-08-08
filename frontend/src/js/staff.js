/**
 * Staff Management Module
 * Handles staff management functionality
 */

import API from './api.js';
import { formatDate, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('staffStats');
const staffTable = document.getElementById('staffTable');
const staffForm = document.getElementById('staffForm');

// ===== DASHBOARD =====
export async function loadStaffDashboard() {
    try {
        const response = await API.staff.getAll();
        if (response.success) {
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading staff dashboard:', error);
    }
}

function updateStats(staff) {
    if (!statsContainer) return;
    
    const total = staff?.length || 0;
    const active = staff?.filter(s => s.status === 'Active').length || 0;
    const onLeave = staff?.filter(s => s.status === 'On Leave').length || 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-users"></i></div>
            <div class="stat-card__number">${total}</div>
            <div class="stat-card__label">Total Staff</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-user-check"></i></div>
            <div class="stat-card__number">${active}</div>
            <div class="stat-card__label">Active</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-user-clock"></i></div>
            <div class="stat-card__number">${onLeave}</div>
            <div class="stat-card__label">On Leave</div>
        </div>
    `;
}

// ===== STAFF LIST =====
export async function loadStaff() {
    try {
        const response = await API.staff.getAll();
        if (response.success && staffTable) {
            renderStaff(response.data);
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function renderStaff(staff) {
    if (!staffTable) return;
    
    if (staff.length === 0) {
        staffTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No staff found
                </td>
            </tr>
        `;
        return;
    }
    
    staffTable.innerHTML = staff.map(member => `
        <tr>
            <td>${member.staffId}</td>
            <td>${member.user?.fullName || 'N/A'}</td>
            <td>${member.position}</td>
            <td>${member.department}</td>
            <td>${member.employmentType}</td>
            <td>${formatDate(member.startDate)}</td>
            <td>${getStatusBadge(member.status)}</td>
            <td>
                <button class="action-btn" onclick="editStaff('${member._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteStaff('${member._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== STAFF OPERATIONS =====
export async function createStaff(data) {
    try {
        const response = await API.staff.create(data);
        if (response.success) {
            showToast('Staff member created successfully', 'success');
            if (staffForm) staffForm.reset();
            loadStaff();
        }
    } catch (error) {
        console.error('Error creating staff:', error);
        showToast('Error creating staff', 'error');
    }
}

export async function updateStaff(id, data) {
    try {
        const response = await API.staff.update(id, data);
        if (response.success) {
            showToast('Staff updated successfully', 'success');
            loadStaff();
        }
    } catch (error) {
        console.error('Error updating staff:', error);
        showToast('Error updating staff', 'error');
    }
}

export async function deleteStaff(id) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
        const response = await API.staff.delete(id);
        if (response.success) {
            showToast('Staff deleted successfully', 'success');
            loadStaff();
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showToast('Error deleting staff', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.editStaff = (id) => window.location.href = `/pages/admin/staff-edit.html?id=${id}`;
window.deleteStaff = deleteStaff;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Staff form
    if (staffForm) {
        staffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(staffForm);
            await createStaff(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.staff-dashboard')) {
        loadStaffDashboard();
    }
    
    if (document.querySelector('.staff-list')) {
        loadStaff();
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
