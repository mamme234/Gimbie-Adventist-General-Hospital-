/**
 * Reports Module
 * Handles reporting and analytics
 */

import API from './api.js';
import { formatDate, formatCurrency } from './utils.js';

// ===== DOM ELEMENTS =====
const reportsContainer = document.getElementById('reportsContainer');
const chartContainer = document.getElementById('chartContainer');

// ===== LOAD REPORTS =====
export async function loadReports() {
    try {
        const [patients, doctors, departments, revenue, admissions, financial] = await Promise.all([
            API.reports.getPatientStats(),
            API.reports.getDoctorStats(),
            API.reports.getDepartmentStats(),
            API.reports.getRevenue(),
            API.reports.getAdmissions(),
            API.reports.getFinancial()
        ]);
        
        if (reportsContainer) {
            renderReports({
                patients: patients.data || {},
                doctors: doctors.data || {},
                departments: departments.data || {},
                revenue: revenue.data || {},
                admissions: admissions.data || {},
                financial: financial.data || {}
            });
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        if (reportsContainer) {
            reportsContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 16px; display: block;"></i>
                    <h3>Unable to load reports</h3>
                    <p>Please try again later or contact support.</p>
                </div>
            `;
        }
    }
}

// ===== RENDER REPORTS =====
function renderReports(data) {
    if (!reportsContainer) return;
    
    reportsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
            <!-- Patient Statistics -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-users" style="color: var(--primary); margin-right: 8px;"></i>
                    Patient Statistics
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${data.patients?.totalPatients || 0}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Patients</div>
                    </div>
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--info);">${data.patients?.active || 0}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Active Patients</div>
                    </div>
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${data.patients?.new || 0}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">New This Month</div>
                    </div>
                </div>
            </div>
            
            <!-- Revenue Statistics -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-money-bill" style="color: var(--primary); margin-right: 8px;"></i>
                    Revenue Statistics
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${formatCurrency(data.revenue?.totalRevenue || 0)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Revenue</div>
                    </div>
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">${formatCurrency(data.revenue?.outstanding || 0)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Outstanding</div>
                    </div>
                </div>
            </div>
            
            <!-- Department Statistics -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-building" style="color: var(--primary); margin-right: 8px;"></i>
                    Department Statistics
                </h3>
                ${data.departments?.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${data.departments.map(d => `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8edea;">
                                <span>${d._id}</span>
                                <span style="font-weight: 600;">${d.count}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <i class="fas fa-building" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                        No department data available
                    </div>
                `}
            </div>
            
            <!-- Doctor Statistics -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow);">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-user-md" style="color: var(--primary); margin-right: 8px;"></i>
                    Doctor Statistics
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${data.doctors?.totalDoctors || 0}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Total Doctors</div>
                    </div>
                    <div style="padding: 12px; background: var(--bg-light); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--info);">${data.doctors?.active || 0}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Active Doctors</div>
                    </div>
                </div>
            </div>
            
            <!-- Financial Analytics -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow); grid-column: span 2;">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-chart-line" style="color: var(--primary); margin-right: 8px;"></i>
                    Financial Analytics
                </h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <div style="padding: 16px; background: var(--bg-light); border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${formatCurrency(data.financial?.revenue || 0)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Revenue</div>
                    </div>
                    <div style="padding: 16px; background: var(--bg-light); border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">${formatCurrency(data.financial?.expenses || 0)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Expenses</div>
                    </div>
                    <div style="padding: 16px; background: var(--bg-light); border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${(data.financial?.profit || 0) >= 0 ? 'var(--primary)' : 'var(--danger)'};">${formatCurrency(data.financial?.profit || 0)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Profit/Loss</div>
                    </div>
                </div>
            </div>
            
            <!-- Admissions -->
            <div style="background: #fff; padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow); grid-column: span 2;">
                <h3 style="margin-bottom: 16px; color: var(--text-primary);">
                    <i class="fas fa-hospital" style="color: var(--primary); margin-right: 8px;"></i>
                    Recent Admissions
                </h3>
                ${data.admissions?.length > 0 ? `
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${data.admissions.slice(0, 10).map(admission => `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8edea;">
                                <span>${admission.patient?.fullName || 'Unknown'}</span>
                                <span style="color: var(--text-secondary);">${formatDate(admission.admissionDate)}</span>
                                <span style="color: var(--text-secondary);">${admission.department || 'General'}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <i class="fas fa-hospital" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                        No admission data available
                    </div>
                `}
            </div>
        </div>
    `;
}

// ===== EXPORT FUNCTIONS =====
export async function exportPDF() {
    try {
        window.open('/api/reports/export/pdf', '_blank');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('Error exporting PDF', 'error');
    }
}

export async function exportExcel() {
    try {
        window.open('/api/reports/export/excel', '_blank');
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showToast('Error exporting Excel', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.exportPDF = exportPDF;
window.exportExcel = exportExcel;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.reports-page')) {
        loadReports();
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
