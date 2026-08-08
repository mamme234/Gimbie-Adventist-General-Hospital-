/**
 * Inventory Module
 * Handles inventory management
 */

import API from './api.js';
import { formatDate, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('inventoryStats');
const itemsTable = document.getElementById('itemsTable');
const lowStockContainer = document.getElementById('lowStock');
const itemForm = document.getElementById('itemForm');

// ===== DASHBOARD =====
export async function loadInventoryDashboard() {
    try {
        const response = await API.inventory?.getAll?.() || { success: false };
        if (response.success) {
            updateStats(response.data);
            renderLowStock(response.data.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock'));
        }
    } catch (error) {
        console.error('Error loading inventory dashboard:', error);
    }
}

function updateStats(items) {
    if (!statsContainer) return;
    
    const total = items?.length || 0;
    const lowStock = items?.filter(i => i.status === 'Low Stock').length || 0;
    const outOfStock = items?.filter(i => i.status === 'Out of Stock').length || 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-boxes"></i></div>
            <div class="stat-card__number">${total}</div>
            <div class="stat-card__label">Total Items</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-exclamation-triangle"></i></div>
            <div class="stat-card__number">${lowStock}</div>
            <div class="stat-card__label">Low Stock</div>
        </div>
        <div class="stat-card stat-card--red">
            <div class="stat-card__icon"><i class="fas fa-times-circle"></i></div>
            <div class="stat-card__number">${outOfStock}</div>
            <div class="stat-card__label">Out of Stock</div>
        </div>
    `;
}

// ===== LOW STOCK =====
function renderLowStock(items) {
    if (!lowStockContainer) return;
    
    if (!items || items.length === 0) {
        lowStockContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> All items are in stock
            </div>
        `;
        return;
    }
    
    lowStockContainer.innerHTML = items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e8edea;">
            <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${item.category}</div>
            </div>
            <div>
                <span style="color: ${item.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)'};">
                    ${item.quantity} / ${item.reorderLevel}
                </span>
                <button class="btn btn--small btn--primary" onclick="restockItem('${item._id}')">Restock</button>
            </div>
        </div>
    `).join('');
}

// ===== ITEMS =====
export async function loadItems() {
    try {
        const response = await API.inventory?.getAll?.() || { success: false };
        if (response.success && itemsTable) {
            renderItems(response.data);
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

function renderItems(items) {
    if (!itemsTable) return;
    
    if (!items || items.length === 0) {
        itemsTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-boxes" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No items found
                </td>
            </tr>
        `;
        return;
    }
    
    itemsTable.innerHTML = items.map(item => `
        <tr>
            <td>${item.itemId}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.reorderLevel}</td>
            <td>${item.unitOfMeasure || 'Units'}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <button class="action-btn" onclick="editItem('${item._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="deleteItem('${item._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== ITEM OPERATIONS =====
export async function createItem(data) {
    try {
        const response = await API.inventory?.create?.(data) || { success: false };
        if (response.success) {
            showToast('Item created successfully', 'success');
            if (itemForm) itemForm.reset();
            loadItems();
        }
    } catch (error) {
        console.error('Error creating item:', error);
        showToast('Error creating item', 'error');
    }
}

export async function updateItem(id, data) {
    try {
        const response = await API.inventory?.update?.(id, data) || { success: false };
        if (response.success) {
            showToast('Item updated successfully', 'success');
            loadItems();
        }
    } catch (error) {
        console.error('Error updating item:', error);
        showToast('Error updating item', 'error');
    }
}

export async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await API.inventory?.delete?.(id) || { success: false };
        if (response.success) {
            showToast('Item deleted successfully', 'success');
            loadItems();
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
}

export async function restockItem(id) {
    const quantity = prompt('Enter quantity to add:');
    if (!quantity) return;
    
    try {
        await API.inventory?.updateStock?.(id, { quantity: parseInt(quantity), notes: 'Manual restock' });
        showToast('Item restocked successfully', 'success');
        loadInventoryDashboard();
        loadItems();
    } catch (error) {
        console.error('Error restocking item:', error);
        showToast('Error restocking item', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.editItem = (id) => window.location.href = `/pages/inventory/item-edit.html?id=${id}`;
window.deleteItem = deleteItem;
window.restockItem = restockItem;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Item form
    if (itemForm) {
        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(itemForm);
            await createItem(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.inventory-dashboard')) {
        loadInventoryDashboard();
    }
    
    if (document.querySelector('.inventory-items')) {
        loadItems();
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
