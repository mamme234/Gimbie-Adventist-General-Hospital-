/**
 * Billing Module
 * Handles billing and invoice functionality
 */

import API from './api.js';
import { formatDate, formatCurrency, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('billingStats');
const invoicesTable = document.getElementById('invoicesTable');
const outstandingContainer = document.getElementById('outstandingList');
const invoiceForm = document.getElementById('invoiceForm');

// ===== DASHBOARD =====
export async function loadBillingDashboard() {
    try {
        const [invoices, outstanding, revenue] = await Promise.all([
            API.billing.getAll(),
            API.billing.getOutstanding(),
            API.billing.getRevenue()
        ]);
        
        if (statsContainer) {
            updateStats(invoices.data, outstanding.data, revenue.data);
        }
        
        if (outstandingContainer) {
            renderOutstanding(outstanding.data);
        }
    } catch (error) {
        console.error('Error loading billing dashboard:', error);
    }
}

function updateStats(invoices, outstanding, revenue) {
    if (!statsContainer) return;
    
    const total = invoices?.length || 0;
    const paid = invoices?.filter(i => i.status === 'Paid').length || 0;
    const pending = invoices?.filter(i => i.status === 'Pending' || i.status === 'Partially Paid').length || 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-file-invoice"></i></div>
            <div class="stat-card__number">${total}</div>
            <div class="stat-card__label">Total Invoices</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-card__number">${paid}</div>
            <div class="stat-card__label">Paid</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-clock"></i></div>
            <div class="stat-card__number">${pending}</div>
            <div class="stat-card__label">Pending</div>
        </div>
        <div class="stat-card stat-card--red">
            <div class="stat-card__icon"><i class="fas fa-money-bill"></i></div>
            <div class="stat-card__number">${formatCurrency(revenue?.totalRevenue || 0)}</div>
            <div class="stat-card__label">Total Revenue</div>
        </div>
    `;
}

// ===== OUTSTANDING =====
function renderOutstanding(outstanding) {
    if (!outstandingContainer) return;
    
    if (!outstanding?.invoices || outstanding.invoices.length === 0) {
        outstandingContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> No outstanding balances
            </div>
        `;
        return;
    }
    
    outstandingContainer.innerHTML = outstanding.invoices.map(inv => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e8edea;">
            <div>
                <div style="font-weight: 600;">${inv.patient?.fullName || 'Unknown Patient'}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${inv.invoiceNumber}</div>
            </div>
            <div>
                <span style="font-weight: 600; color: var(--danger);">${formatCurrency(inv.balance)}</span>
                <button class="btn btn--small btn--primary" onclick="processPayment('${inv._id}')">Pay</button>
            </div>
        </div>
    `).join('');
}

// ===== INVOICES =====
export async function loadInvoices() {
    try {
        const response = await API.billing.getAll();
        if (response.success && invoicesTable) {
            renderInvoices(response.data);
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function renderInvoices(invoices) {
    if (!invoicesTable) return;
    
    if (invoices.length === 0) {
        invoicesTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-file-invoice" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No invoices found
                </td>
            </tr>
        `;
        return;
    }
    
    invoicesTable.innerHTML = invoices.map(inv => `
        <tr>
            <td>${inv.invoiceNumber}</td>
            <td>${inv.patient?.fullName || 'N/A'}</td>
            <td>${formatCurrency(inv.total)}</td>
            <td>${formatCurrency(inv.paidAmount)}</td>
            <td>${formatCurrency(inv.balance)}</td>
            <td>${formatDate(inv.createdAt)}</td>
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

// ===== INVOICE OPERATIONS =====
export async function createInvoice(data) {
    try {
        const response = await API.billing.create(data);
        if (response.success) {
            showToast('Invoice created successfully', 'success');
            if (invoiceForm) invoiceForm.reset();
            loadInvoices();
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        showToast('Error creating invoice', 'error');
    }
}

export async function processPayment(invoiceId) {
    const amount = prompt('Enter payment amount:');
    if (!amount) return;
    
    const method = prompt('Payment method (Cash/Card/Telebirr):');
    if (!method) return;
    
    try {
        const response = await API.billing.pay(invoiceId, {
            amount: parseFloat(amount),
            method: method
        });
        if (response.success) {
            showToast('Payment processed successfully', 'success');
            loadBillingDashboard();
            loadInvoices();
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Error processing payment', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.viewInvoice = (id) => window.location.href = `/pages/admin/invoice-detail.html?id=${id}`;
window.payInvoice = processPayment;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Invoice form
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(invoiceForm);
            const items = [];
            // Parse items from form (simplified)
            await createInvoice(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.billing-dashboard')) {
        loadBillingDashboard();
    }
    
    if (document.querySelector('.billing-invoices')) {
        loadInvoices();
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
