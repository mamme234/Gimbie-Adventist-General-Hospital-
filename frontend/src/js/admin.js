/**
 * Admin Dashboard Module
 * Handles admin-specific functionality
 */

import API from './api.js';
import { formatDate, formatCurrency, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('adminStats');
const patientsTable = document.getElementById('patientsTable');
const appointmentsTable = document.getElementById('appointmentsTable');
const doctorsTable = document.getElementById('doctorsTable');
const staffTable = document.getElementById('staffTable');
const billingTable = document.getElementById('billingTable');
const pharmacyTable = document.getElementById('pharmacyTable');
const labTable = document.getElementById('labTable');
const radiologyTable = document.getElementById('radiologyTable');
const inventoryTable = document.getElementById('inventoryTable');
const reportsContainer = document.getElementById('reportsContainer');

// ===== DASHBOARD =====
export async function loadAdminDashboard() {
    try {
        const response = await API.reports.getPatientStats();
        if (response.success) {
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

function updateStats(data) {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-users"></i></div>
            <div class="stat-card__number">${data.totalPatients || 0}</div>
            <div class="stat-card__label">Total Patients</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-user-md"></i></div>
            <div class="stat-card__number">${data.totalDoctors || 0}</div>
            <div class="stat-card__label">Total Doctors</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-card__number">${data.todayAppointments || 0}</div>
            <div class="stat-card__label">Today's Appointments</div>
        </div>
        <div class="stat-card stat-card--red">
            <div class="stat-card__icon"><i class="fas fa-money-bill"></i></div>
            <div class="stat-card__number">${formatCurrency(data.totalRevenue || 0)}</div>
            <div class="stat-card__label">Total Revenue</div>
        </div>
    `;
}

// ===== PATIENTS MANAGEMENT =====
export async function loadPatients(page = 1, search = '') {
    try {
        const params = { page, limit: 20 };
        if (search) params.search = search;
        
        const response = await API.patients.getAll(params);
        if (response.success && patientsTable) {
            renderPatientsTable(response.data, response.pagination);
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

function renderPatientsTable(patients, pagination) {
    if (!patientsTable) return;
    
    if (patients.length === 0) {
        patientsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No patients found
                </td>
            </tr>
        `;
        return;
    }
    
    patientsTable.innerHTML = patients.map(patient => `
        <tr>
            <td><strong>${patient.patientId}</strong></td>
            <td>${patient.fullName}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.email || 'N/A'}</td>
            <td>${getStatusBadge(patient.status)}</td>
            <td>
                <button class="action-btn" onclick="viewPatient('${patient._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editPatient('${patient._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn danger" onclick="deletePatient('${patient._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== APPOINTMENTS MANAGEMENT =====
export async function loadAppointments(date = null) {
    try {
        const params = {};
        if (date) params.date = date;
        
        const response = await API.appointments.getAll(params);
        if (response.success && appointmentsTable) {
            renderAppointmentsTable(response.data);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

function renderAppointmentsTable(appointments) {
    if (!appointmentsTable) return;
    
    if (appointments.length === 0) {
        appointmentsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-calendar" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No appointments found
                </td>
            </tr>
        `;
        return;
    }
    
    appointmentsTable.innerHTML = appointments.map(app => `
        <tr>
            <td>${app.appointmentId}</td>
            <td>${app.patient?.fullName || 'N/A'}</td>
            <td>${app.doctor?.userId?.fullName || 'N/A'}</td>
            <td>${formatDate(app.date)}</td>
            <td>${app.time}</td>
            <td>${getStatusBadge(app.status)}</td>
            <td>
                <button class="action-btn" onclick="viewAppointment('${app._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editAppointment('${app._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== DOCTORS MANAGEMENT =====
export async function loadDoctors() {
    try {
        const response = await API.doctors.getAll();
        if (response.success && doctorsTable) {
            renderDoctorsTable(response.data);
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

function renderDoctorsTable(doctors) {
    if (!doctorsTable) return;
    
    if (doctors.length === 0) {
        doctorsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-user-md" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No doctors found
                </td>
            </tr>
        `;
        return;
    }
    
    doctorsTable.innerHTML = doctors.map(doc => `
        <tr>
            <td>${doc.userId?.fullName || 'N/A'}</td>
            <td>${doc.specialty}</td>
            <td>${doc.department}</td>
            <td>${doc.licenseNumber}</td>
            <td>${getStatusBadge(doc.isAvailable ? 'Active' : 'Inactive')}</td>
            <td>
                <button class="action-btn" onclick="viewDoctor('${doc._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editDoctor('${doc._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== STAFF MANAGEMENT =====
export async function loadStaff() {
    try {
        const response = await API.staff.getAll();
        if (response.success && staffTable) {
            renderStaffTable(response.data);
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function renderStaffTable(staff) {
    if (!staffTable) return;
    
    if (staff.length === 0) {
        staffTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
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
            <td>${getStatusBadge(member.status)}</td>
            <td>
                <button class="action-btn" onclick="viewStaff('${member._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editStaff('${member._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== BILLING MANAGEMENT =====
export async function loadBilling() {
    try {
        const response = await API.billing.getAll();
        if (response.success && billingTable) {
            renderBillingTable(response.data);
        }
    } catch (error) {
        console.error('Error loading billing:', error);
    }
}

function renderBillingTable(invoices) {
    if (!billingTable) return;
    
    if (invoices.length === 0) {
        billingTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-file-invoice" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No invoices found
                </td>
            </tr>
        `;
        return;
    }
    
    billingTable.innerHTML = invoices.map(inv => `
        <tr>
            <td>${inv.invoiceNumber}</td>
            <td>${inv.patient?.fullName || 'N/A'}</td>
            <td>${formatCurrency(inv.total)}</td>
            <td>${formatCurrency(inv.paidAmount)}</td>
            <td>${formatCurrency(inv.balance)}</td>
            <td>${getStatusBadge(inv.status)}</td>
            <td>
                <button class="action-btn" onclick="viewInvoice('${inv._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="payInvoice('${inv._id}')" title="Pay">
                    <i class="fas fa-credit-card"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== PHARMACY MANAGEMENT =====
export async function loadPharmacy() {
    try {
        const response = await API.pharmacy.getAll();
        if (response.success && pharmacyTable) {
            renderPharmacyTable(response.data);
        }
    } catch (error) {
        console.error('Error loading pharmacy:', error);
    }
}

function renderPharmacyTable(medications) {
    if (!pharmacyTable) return;
    
    if (medications.length === 0) {
        pharmacyTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-pills" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No medications found
                </td>
            </tr>
        `;
        return;
    }
    
    pharmacyTable.innerHTML = medications.map(med => `
        <tr>
            <td>${med.medicationId}</td>
            <td>${med.name}</td>
            <td>${med.category}</td>
            <td>${med.stockQuantity}</td>
            <td>${med.reorderLevel}</td>
            <td>${getStatusBadge(med.stockQuantity <= med.reorderLevel ? 'Low Stock' : 'In Stock')}</td>
            <td>
                <button class="action-btn" onclick="viewMedication('${med._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editMedication('${med._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== LABORATORY MANAGEMENT =====
export async function loadLaboratory() {
    try {
        const response = await API.laboratory.getAll();
        if (response.success && labTable) {
            renderLabTable(response.data);
        }
    } catch (error) {
        console.error('Error loading laboratory:', error);
    }
}

function renderLabTable(tests) {
    if (!labTable) return;
    
    if (tests.length === 0) {
        labTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-microscope" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No lab tests found
                </td>
            </tr>
        `;
        return;
    }
    
    labTable.innerHTML = tests.map(test => `
        <tr>
            <td>${test.testId}</td>
            <td>${test.patient?.fullName || 'N/A'}</td>
            <td>${test.testName}</td>
            <td>${test.category}</td>
            <td>${getStatusBadge(test.status)}</td>
            <td>
                <button class="action-btn" onclick="viewLabTest('${test._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editLabTest('${test._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== RADIOLOGY MANAGEMENT =====
export async function loadRadiology() {
    try {
        const response = await API.radiology?.getAll?.() || { success: false };
        if (response.success && radiologyTable) {
            renderRadiologyTable(response.data);
        }
    } catch (error) {
        console.error('Error loading radiology:', error);
    }
}

function renderRadiologyTable(exams) {
    if (!radiologyTable) return;
    
    if (!exams || exams.length === 0) {
        radiologyTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-x-ray" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No radiology exams found
                </td>
            </tr>
        `;
        return;
    }
    
    radiologyTable.innerHTML = exams.map(exam => `
        <tr>
            <td>${exam.radiologyId}</td>
            <td>${exam.patient?.fullName || 'N/A'}</td>
            <td>${exam.examType}</td>
            <td>${exam.bodyPart}</td>
            <td>${getStatusBadge(exam.status)}</td>
            <td>
                <button class="action-btn" onclick="viewRadiology('${exam._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editRadiology('${exam._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== INVENTORY MANAGEMENT =====
export async function loadInventory() {
    try {
        const response = await API.inventory?.getAll?.() || { success: false };
        if (response.success && inventoryTable) {
            renderInventoryTable(response.data);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function renderInventoryTable(items) {
    if (!inventoryTable) return;
    
    if (!items || items.length === 0) {
        inventoryTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-boxes" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No inventory items found
                </td>
            </tr>
        `;
        return;
    }
    
    inventoryTable.innerHTML = items.map(item => `
        <tr>
            <td>${item.itemId}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.reorderLevel}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="action-btn" onclick="viewInventory('${item._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editInventory('${item._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== REPORTS =====
export async function loadReports() {
    try {
        const [patients, doctors, departments, revenue] = await Promise.all([
            API.reports.getPatientStats(),
            API.reports.getDoctorStats(),
            API.reports.getDepartmentStats(),
            API.reports.getRevenue()
        ]);
        
        if (reportsContainer) {
            renderReports({
                patients: patients.data || {},
                doctors: doctors.data || {},
                departments: departments.data || {},
                revenue: revenue.data || {}
            });
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function renderReports(data) {
    if (!reportsContainer) return;
    
    reportsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3>Patient Statistics</h3>
                <p>Total: ${data.patients?.totalPatients || 0}</p>
                <p>Active: ${data.patients?.active || 0}</p>
            </div>
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3>Revenue</h3>
                <p>Total: ${formatCurrency(data.revenue?.totalRevenue || 0)}</p>
                <p>Outstanding: ${formatCurrency(data.revenue?.outstanding || 0)}</p>
            </div>
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3>Department Statistics</h3>
                ${data.departments?.map(d => `
                    <p>${d._id}: ${d.count}</p>
                `).join('') || '<p>No data</p>'}
            </div>
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3>Doctor Statistics</h3>
                <p>Total: ${data.doctors?.totalDoctors || 0}</p>
                <p>Active: ${data.doctors?.active || 0}</p>
            </div>
        </div>
    `;
}

// ===== EXPOSE GLOBALLY =====
window.viewPatient = (id) => window.location.href = `/pages/admin/patient-detail.html?id=${id}`;
window.editPatient = (id) => window.location.href = `/pages/admin/patient-edit.html?id=${id}`;
window.deletePatient = async (id) => {
    if (confirm('Are you sure you want to delete this patient?')) {
        try {
            await API.patients.delete(id);
            loadPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    }
};

window.viewAppointment = (id) => window.location.href = `/pages/admin/appointment-detail.html?id=${id}`;
window.editAppointment = (id) => window.location.href = `/pages/admin/appointment-edit.html?id=${id}`;

window.viewDoctor = (id) => window.location.href = `/pages/admin/doctor-detail.html?id=${id}`;
window.editDoctor = (id) => window.location.href = `/pages/admin/doctor-edit.html?id=${id}`;

window.viewStaff = (id) => window.location.href = `/pages/admin/staff-detail.html?id=${id}`;
window.editStaff = (id) => window.location.href = `/pages/admin/staff-edit.html?id=${id}`;

window.viewInvoice = (id) => window.location.href = `/pages/admin/invoice-detail.html?id=${id}`;
window.payInvoice = (id) => window.location.href = `/pages/admin/invoice-pay.html?id=${id}`;

window.viewMedication = (id) => window.location.href = `/pages/pharmacy/medication-detail.html?id=${id}`;
window.editMedication = (id) => window.location.href = `/pages/pharmacy/medication-edit.html?id=${id}`;

window.viewLabTest = (id) => window.location.href = `/pages/laboratory/test-detail.html?id=${id}`;
window.editLabTest = (id) => window.location.href = `/pages/laboratory/test-edit.html?id=${id}`;

window.viewRadiology = (id) => window.location.href = `/pages/radiology/exam-detail.html?id=${id}`;
window.editRadiology = (id) => window.location.href = `/pages/radiology/exam-edit.html?id=${id}`;

window.viewInventory = (id) => window.location.href = `/pages/inventory/item-detail.html?id=${id}`;
window.editInventory = (id) => window.location.href = `/pages/inventory/item-edit.html?id=${id}`;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    switch(page) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'staff':
            loadStaff();
            break;
        case 'billing':
            loadBilling();
            break;
        case 'pharmacy':
            loadPharmacy();
            break;
        case 'laboratory':
            loadLaboratory();
            break;
        case 'radiology':
            loadRadiology();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'reports':
            loadReports();
            break;
    }
});
