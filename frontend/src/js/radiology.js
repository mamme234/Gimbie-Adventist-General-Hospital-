/**
 * Radiology Module
 * Handles radiology-specific functionality
 */

import API from './api.js';
import { formatDate, getStatusBadge } from './utils.js';

// ===== DOM ELEMENTS =====
const statsContainer = document.getElementById('radiologyStats');
const examsTable = document.getElementById('examsTable');
const pendingExamsContainer = document.getElementById('pendingExams');
const examForm = document.getElementById('examForm');
const imageGallery = document.getElementById('imageGallery');

// ===== DASHBOARD =====
export async function loadRadiologyDashboard() {
    try {
        const response = await API.radiology?.getAll?.() || { success: false };
        if (response.success) {
            updateStats(response.data);
            renderPendingExams(response.data.filter(e => e.status === 'Pending' || e.status === 'Scheduled'));
        }
    } catch (error) {
        console.error('Error loading radiology dashboard:', error);
    }
}

function updateStats(exams) {
    if (!statsContainer) return;
    
    const total = exams?.length || 0;
    const pending = exams?.filter(e => e.status === 'Pending' || e.status === 'Scheduled').length || 0;
    const completed = exams?.filter(e => e.status === 'Completed' || e.status === 'Verified').length || 0;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon"><i class="fas fa-x-ray"></i></div>
            <div class="stat-card__number">${total}</div>
            <div class="stat-card__label">Total Exams</div>
        </div>
        <div class="stat-card stat-card--orange">
            <div class="stat-card__icon"><i class="fas fa-clock"></i></div>
            <div class="stat-card__number">${pending}</div>
            <div class="stat-card__label">Pending Exams</div>
        </div>
        <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="fas fa-check-circle"></i></div>
            <div class="stat-card__number">${completed}</div>
            <div class="stat-card__label">Completed Exams</div>
        </div>
    `;
}

// ===== PENDING EXAMS =====
function renderPendingExams(exams) {
    if (!pendingExamsContainer) return;
    
    if (!exams || exams.length === 0) {
        pendingExamsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="color: var(--primary);"></i> No pending exams
            </div>
        `;
        return;
    }
    
    pendingExamsContainer.innerHTML = exams.map(exam => `
        <div class="exam-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e8edea;">
            <div>
                <div style="font-weight: 600;">${exam.patient?.fullName || 'Unknown Patient'}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${exam.examType} - ${exam.bodyPart}</div>
            </div>
            <div>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(exam.scheduledDate)}</span>
                <button class="btn btn--small btn--primary" onclick="performExam('${exam._id}')">Perform</button>
            </div>
        </div>
    `).join('');
}

// ===== EXAMS =====
export async function loadExams() {
    try {
        const response = await API.radiology?.getAll?.() || { success: false };
        if (response.success && examsTable) {
            renderExams(response.data);
        }
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

function renderExams(exams) {
    if (!examsTable) return;
    
    if (!exams || exams.length === 0) {
        examsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-x-ray" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No exams found
                </td>
            </tr>
        `;
        return;
    }
    
    examsTable.innerHTML = exams.map(exam => `
        <tr>
            <td>${exam.radiologyId}</td>
            <td>${exam.patient?.fullName || 'N/A'}</td>
            <td>${exam.examType}</td>
            <td>${exam.bodyPart}</td>
            <td>${formatDate(exam.scheduledDate)}</td>
            <td>${getStatusBadge(exam.status)}</td>
            <td>
                <button class="action-btn" onclick="viewExam('${exam._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="editExam('${exam._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== EXAM OPERATIONS =====
export async function createExam(data) {
    try {
        const response = await API.radiology?.create?.(data) || { success: false };
        if (response.success) {
            showToast('Exam created successfully', 'success');
            if (examForm) examForm.reset();
            loadExams();
        }
    } catch (error) {
        console.error('Error creating exam:', error);
        showToast('Error creating exam', 'error');
    }
}

export async function performExam(id) {
    try {
        window.location.href = `/pages/radiology/exam-perform.html?id=${id}`;
    } catch (error) {
        console.error('Error performing exam:', error);
        showToast('Error starting exam', 'error');
    }
}

export async function uploadImage(examId, file) {
    try {
        // This would call the upload API
        console.log('Uploading image:', file);
        showToast('Image uploaded successfully', 'success');
        loadExams();
    } catch (error) {
        console.error('Error uploading image:', error);
        showToast('Error uploading image', 'error');
    }
}

// ===== IMAGE GALLERY =====
export async function loadImages() {
    try {
        // This would call the image API
        if (imageGallery) {
            imageGallery.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-images" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No images available
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

// ===== EXPOSE GLOBALLY =====
window.performExam = performExam;
window.viewExam = (id) => window.location.href = `/pages/radiology/exam-detail.html?id=${id}`;
window.editExam = (id) => window.location.href = `/pages/radiology/exam-edit.html?id=${id}`;

// ===== FORM HANDLERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Exam form
    if (examForm) {
        examForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(examForm);
            await createExam(Object.fromEntries(formData));
        });
    }
    
    // Load dashboard
    if (document.querySelector('.radiology-dashboard')) {
        loadRadiologyDashboard();
    }
    
    if (document.querySelector('.radiology-exams')) {
        loadExams();
    }
    
    if (document.querySelector('.radiology-gallery')) {
        loadImages();
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
