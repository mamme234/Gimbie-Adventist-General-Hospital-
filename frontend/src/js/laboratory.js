/**
 * Laboratory Module
 * Handles laboratory-specific functionality
 */

import API from './api.js';
import { formatDate, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('labStats');
const testsTable = document.getElementById('testsTable');
const pendingTestsContainer = document.getElementById('pendingTests');
const testForm = document.getElementById('testForm');
const resultsForm = document.getElementById('resultsForm');

// ===== DASHBOARD =====
export async function loadLabDashboard() {
    try {
        const [all, pending, today] = await Promise.all([
            API.laboratory.getAll(),
            API.laboratory.getPending(),
            API.laboratory.getTodayTests?.() || { success: false }
        ]);
        
        if (statsContainer) {
            updateStats(all.data, pending.data, today.data);
        }
        
        if (pendingTestsContainer) {
            renderPendingTests(pending.data);
        }
    } catch (error) {
        console.error('Error loading lab dashboard:', error);
    }
}

function updateStats(all, pending, today) {
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-flask"></i></div>
            <div class="stat-card__number">${all?.length || 0}</div>
            <div class="stat-card__label">Total Tests</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-clock"></i></div>
            <div class="stat-card__number">${pending?.length || 0}</div>
            <div class="stat-card__label">Pending Tests</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-calendar-day"></i></div>
            <div class="stat-card__number">${today?.length || 0}</div>
            <div class="stat-card__label">Today's Tests</div>
        </div>
    `;
}

// ===== PENDING TESTS =====
function renderPendingTests(tests) {
    if (!pendingTestsContainer) return;
    
    if (!tests || tests.length === 0) {
        pendingTestsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> No pending tests
            </div>
        `;
        return;
    }
    
    pendingTestsContainer.innerHTML = tests.map(test => `
        <div class="test-item">
            <div>
                <div class="patient">${test.patient?.fullName || 'Unknown Patient'}</div>
                <div class="test-name">${test.testName}</div>
            </div>
            <div>
                <span class="priority priority--${test.priority?.toLowerCase() || 'routine'}">${test.priority || 'Routine'}</span>
                <button class="btn btn--small btn--primary" onclick="processTest('${test._id}')">Process</button>
            </div>
        </div>
    `).join('');
}

// ===== TESTS =====
export async function loadTests() {
    try {
        const response = await API.laboratory.getAll();
        if (response.success && testsTable) {
            renderTests(response.data);
        }
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

function renderTests(tests) {
    if (!testsTable) return;
    
    if (tests.length === 0) {
        testsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-flask" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No tests found
                </td>
            </tr>
        `;
        return;
    }
    
    testsTable.innerHTML = tests.map(test => `
        <tr>
            <td>${test.testId}</td>
            <td>${test.patient?.fullName || 'N/A'}</td>
            <td>${test.testName}</td>
            <td>${test.category}</td>
            <td>${test.sampleType}</td>
            <td>${getStatusBadge(test.status)}</td>
            <td>
                <button class="action-btn" onclick="viewTest('${test._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editTest('${test._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== TEST OPERATIONS =====
export async function createTest(data) {
    try {
        const response = await API.laboratory.create(data);
        if (response.success) {
            showToast('Test created successfully', 'success');
            if (testForm) testForm.reset();
            loadTests();
        }
    } catch (error) {
        console.error('Error creating test:', error);
        showToast('Error creating test', 'error');
    }
}

export async function processTest(id) {
    try {
        await API.laboratory.collectSample(id);
        showToast('Sample collected', 'success');
        loadLabDashboard();
    } catch (error) {
        console.error('Error processing test:', error);
        showToast('Error processing test', 'error');
    }
}

export async function enterResults(id, results) {
    try {
        await API.laboratory.enterResults(id, results);
        showToast('Results entered successfully', 'success');
        loadLabDashboard();
    } catch (error) {
        console.error('Error entering results:', error);
        showToast('Error entering results', 'error');
    }
}

export async function verifyResults(id) {
    try {
        await API.laboratory.verifyResults(id);
        showToast('Results verified successfully', 'success');
        loadLabDashboard();
    } catch (error) {
        console.error('Error verifying results:', error);
        showToast('Error verifying results', 'error');
    }
}

// ===== EXPOSE GLOBALLY =====
window.processTest = processTest;
window.viewTest = (id) => window.location.href = `/pages/laboratory/test-detail.html?id=${id}`;
window.editTest = (id) => window.location.href = `/pages/laboratory/test-edit.html?id=${id}`;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Test form
    if (testForm) {
        testForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(testForm);
            await createTest(Object.fromEntries(formData));
        });
    }
    
    // Results form
    if (resultsForm) {
        resultsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(resultsForm);
            const testId = resultsForm.dataset.testId;
            if (testId) {
                await enterResults(testId, Object.fromEntries(formData));
            }
        });
    }
    
    // Load dashboard
    if (document.querySelector('.lab-dashboard')) {
        loadLabDashboard();
    }
    
    if (document.querySelector('.lab-tests')) {
        loadTests();
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
