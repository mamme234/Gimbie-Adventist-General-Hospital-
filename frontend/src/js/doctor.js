// src/js/doctor.js
// ============================================
// DOCTOR PORTAL - COMPLETE FUNCTIONALITY
// ============================================

const API_BASE_URL = 'https://alpha-af1q.onrender.com/api';

// ===== AUTH =====
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

function isLoggedIn() {
    const token = getToken();
    const user = getUser();
    return !!(token && user && user.role === 'doctor');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
}

// ===== API REQUEST HELPER =====
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
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

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    try {
        const user = getUser();
        const doctorId = user?.id;

        // Get today's appointments
        const appointments = await apiRequest(`/appointments/doctor/${doctorId}/today`);
        const totalPatients = await apiRequest(`/patients/doctor/${doctorId}/count`);
        const pendingConsultations = await apiRequest(`/appointments/doctor/${doctorId}/pending`);

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-info">
                    <h3>${appointments?.data?.length || 0}</h3>
                    <p>Today's Appointments</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-info">
                    <h3>${totalPatients?.data?.count || 0}</h3>
                    <p>Total Patients</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-info">
                    <h3>${pendingConsultations?.data?.length || 0}</h3>
                    <p>Pending Consultations</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-prescription"></i></div>
                <div class="stat-info">
                    <h3>${await getPrescriptionsCount()}</h3>
                    <p>Today's Prescriptions</p>
                </div>
            </div>
        `;

        // Load recent appointments
        await loadRecentAppointments();

        // Load today's schedule
        await loadTodaySchedule();

    } catch (error) {
        console.error('Dashboard error:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

async function getPrescriptionsCount() {
    try {
        const response = await apiRequest('/prescriptions/today');
        return response?.data?.length || 0;
    } catch {
        return 0;
    }
}

async function loadRecentAppointments() {
    const container = document.getElementById('recentAppointments');
    if (!container) return;

    try {
        const user = getUser();
        const appointments = await apiRequest(`/appointments/doctor/${user.id}/recent`);

        if (appointments?.data?.length > 0) {
            container.innerHTML = appointments.data.slice(0, 5).map(app => `
                <div class="appointment-item">
                    <div class="patient-info">
                        <span class="patient-name">${app.patientName || 'Unknown'}</span>
                        <span class="appointment-time">${app.time}</span>
                    </div>
                    <span class="status status-${app.status?.toLowerCase()}">${app.status || 'Scheduled'}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No recent appointments</p>';
        }
    } catch (error) {
        console.error('Recent appointments error:', error);
        container.innerHTML = '<p class="empty-state">Failed to load appointments</p>';
    }
}

async function loadTodaySchedule() {
    const container = document.getElementById('todaySchedule');
    if (!container) return;

    try {
        const user = getUser();
        const schedule = await apiRequest(`/appointments/doctor/${user.id}/schedule`);

        if (schedule?.data?.length > 0) {
            container.innerHTML = schedule.data.map(app => `
                <div class="schedule-item">
                    <span class="time">${app.time}</span>
                    <span class="patient">${app.patientName || 'Unknown'}</span>
                    <span class="type">${app.type || 'Consultation'}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No appointments scheduled today</p>';
        }
    } catch (error) {
        console.error('Schedule error:', error);
        container.innerHTML = '<p class="empty-state">Failed to load schedule</p>';
    }
}

// ============================================
// APPOINTMENTS
// ============================================
async function loadAppointments() {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;

    try {
        const user = getUser();
        const appointments = await apiRequest(`/appointments/doctor/${user.id}`);

        if (appointments?.data?.length > 0) {
            container.innerHTML = appointments.data.map(app => `
                <tr>
                    <td>${app.patientName || 'Unknown'}</td>
                    <td>${app.date}</td>
                    <td>${app.time}</td>
                    <td><span class="status status-${app.status?.toLowerCase()}">${app.status || 'Scheduled'}</span></td>
                    <td>
                        <button onclick="viewAppointment('${app._id}')" class="btn-sm btn-info">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="startConsultation('${app._id}')" class="btn-sm btn-primary">
                            <i class="fas fa-stethoscope"></i>
                        </button>
                        <button onclick="cancelAppointment('${app._id}')" class="btn-sm btn-danger">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No appointments found</td></tr>';
        }
    } catch (error) {
        console.error('Appointments error:', error);
        container.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load appointments</td></tr>';
    }
}

async function viewAppointment(id) {
    try {
        const appointment = await apiRequest(`/appointments/${id}`);
        // Show modal with appointment details
        showAppointmentModal(appointment.data);
    } catch (error) {
        showToast('Failed to load appointment details', 'error');
    }
}

function showAppointmentModal(appointment) {
    // Implement modal display
    console.log('Appointment details:', appointment);
}

async function startConsultation(id) {
    try {
        await apiRequest(`/appointments/${id}/start`, { method: 'PUT' });
        showToast('Consultation started!', 'success');
        loadAppointments();
    } catch (error) {
        showToast('Failed to start consultation', 'error');
    }
}

async function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
        await apiRequest(`/appointments/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason: 'Cancelled by doctor' })
        });
        showToast('Appointment cancelled', 'success');
        loadAppointments();
    } catch (error) {
        showToast('Failed to cancel appointment', 'error');
    }
}

// ============================================
// PATIENTS
// ============================================
async function loadPatients() {
    const container = document.getElementById('patientsContainer');
    if (!container) return;

    try {
        const user = getUser();
        const patients = await apiRequest(`/patients/doctor/${user.id}`);

        if (patients?.data?.length > 0) {
            container.innerHTML = patients.data.map(patient => `
                <tr>
                    <td>${patient.fullName || 'Unknown'}</td>
                    <td>${patient.patientId || 'N/A'}</td>
                    <td>${patient.phone || 'N/A'}</td>
                    <td>${patient.lastVisit || 'Never'}</td>
                    <td>
                        <button onclick="viewPatient('${patient._id}')" class="btn-sm btn-info">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="viewPatientHistory('${patient._id}')" class="btn-sm btn-secondary">
                            <i class="fas fa-history"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No patients found</td></tr>';
        }
    } catch (error) {
        console.error('Patients error:', error);
        container.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load patients</td></tr>';
    }
}

async function viewPatient(id) {
    try {
        const patient = await apiRequest(`/patients/${id}`);
        showPatientModal(patient.data);
    } catch (error) {
        showToast('Failed to load patient details', 'error');
    }
}

async function viewPatientHistory(id) {
    try {
        const history = await apiRequest(`/patients/${id}/history`);
        // Show history in modal
        console.log('Patient history:', history.data);
    } catch (error) {
        showToast('Failed to load patient history', 'error');
    }
}

function showPatientModal(patient) {
    // Implement patient modal
    console.log('Patient details:', patient);
}

// ============================================
// CONSULTATIONS
// ============================================
async function loadConsultations() {
    const container = document.getElementById('consultationsContainer');
    if (!container) return;

    try {
        const user = getUser();
        const consultations = await apiRequest(`/consultations/doctor/${user.id}`);

        if (consultations?.data?.length > 0) {
            container.innerHTML = consultations.data.map(consult => `
                <div class="consultation-card">
                    <div class="consult-header">
                        <h4>${consult.patientName || 'Unknown Patient'}</h4>
                        <span class="status status-${consult.status?.toLowerCase()}">${consult.status || 'Pending'}</span>
                    </div>
                    <div class="consult-body">
                        <p><strong>Date:</strong> ${consult.date}</p>
                        <p><strong>Time:</strong> ${consult.time}</p>
                        <p><strong>Symptoms:</strong> ${consult.symptoms || 'Not specified'}</p>
                    </div>
                    <div class="consult-actions">
                        <button onclick="addDiagnosis('${consult._id}')" class="btn-sm btn-primary">
                            <i class="fas fa-notes-medical"></i> Add Diagnosis
                        </button>
                        <button onclick="prescribeMedication('${consult._id}')" class="btn-sm btn-success">
                            <i class="fas fa-prescription"></i> Prescribe
                        </button>
                        <button onclick="completeConsultation('${consult._id}')" class="btn-sm btn-info">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No consultations found</p>';
        }
    } catch (error) {
        console.error('Consultations error:', error);
        container.innerHTML = '<p class="empty-state">Failed to load consultations</p>';
    }
}

async function addDiagnosis(id) {
    const diagnosis = prompt('Enter diagnosis:');
    if (!diagnosis) return;

    try {
        await apiRequest(`/consultations/${id}/diagnosis`, {
            method: 'PUT',
            body: JSON.stringify({ diagnosis })
        });
        showToast('Diagnosis added successfully!', 'success');
        loadConsultations();
    } catch (error) {
        showToast('Failed to add diagnosis', 'error');
    }
}

async function prescribeMedication(id) {
    const medication = prompt('Enter prescription (medication, dosage, frequency):');
    if (!medication) return;

    try {
        await apiRequest(`/consultations/${id}/prescribe`, {
            method: 'PUT',
            body: JSON.stringify({ prescription: medication })
        });
        showToast('Prescription added successfully!', 'success');
        loadConsultations();
    } catch (error) {
        showToast('Failed to add prescription', 'error');
    }
}

async function completeConsultation(id) {
    if (!confirm('Mark this consultation as complete?')) return;

    try {
        await apiRequest(`/consultations/${id}/complete`, { method: 'PUT' });
        showToast('Consultation completed!', 'success');
        loadConsultations();
    } catch (error) {
        showToast('Failed to complete consultation', 'error');
    }
}

// ============================================
// PRESCRIPTIONS
// ============================================
async function loadPrescriptions() {
    const container = document.getElementById('prescriptionsContainer');
    if (!container) return;

    try {
        const user = getUser();
        const prescriptions = await apiRequest(`/prescriptions/doctor/${user.id}`);

        if (prescriptions?.data?.length > 0) {
            container.innerHTML = prescriptions.data.map(script => `
                <tr>
                    <td>${script.patientName || 'Unknown'}</td>
                    <td>${script.medication}</td>
                    <td>${script.dosage}</td>
                    <td>${script.frequency}</td>
                    <td>${script.date}</td>
                    <td><span class="status status-${script.status?.toLowerCase()}">${script.status || 'Active'}</span></td>
                    <td>
                        <button onclick="viewPrescription('${script._id}')" class="btn-sm btn-info">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="refillPrescription('${script._id}')" class="btn-sm btn-success">
                            <i class="fas fa-refresh"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="7" class="empty-state">No prescriptions found</td></tr>';
        }
    } catch (error) {
        console.error('Prescriptions error:', error);
        container.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load prescriptions</td></tr>';
    }
}

async function viewPrescription(id) {
    try {
        const script = await apiRequest(`/prescriptions/${id}`);
        // Show prescription modal
        console.log('Prescription details:', script.data);
    } catch (error) {
        showToast('Failed to load prescription', 'error');
    }
}

async function refillPrescription(id) {
    try {
        await apiRequest(`/prescriptions/${id}/refill`, { method: 'PUT' });
        showToast('Prescription refilled!', 'success');
        loadPrescriptions();
    } catch (error) {
        showToast('Failed to refill prescription', 'error');
    }
}

// ============================================
// LAB REQUESTS
// ============================================
async function loadLabRequests() {
    const container = document.getElementById('labRequestsContainer');
    if (!container) return;

    try {
        const user = getUser();
        const labs = await apiRequest(`/laboratory/doctor/${user.id}`);

        if (labs?.data?.length > 0) {
            container.innerHTML = labs.data.map(lab => `
                <tr>
                    <td>${lab.patientName || 'Unknown'}</td>
                    <td>${lab.testType}</td>
                    <td>${lab.requestDate}</td>
                    <td><span class="status status-${lab.status?.toLowerCase()}">${lab.status || 'Pending'}</span></td>
                    <td>
                        <button onclick="viewLabResult('${lab._id}')" class="btn-sm btn-info">
                            <i class="fas fa-file-medical-alt"></i>
                        </button>
                        <button onclick="updateLabStatus('${lab._id}')" class="btn-sm btn-primary">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No lab requests found</td></tr>';
        }
    } catch (error) {
        console.error('Lab requests error:', error);
        container.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load lab requests</td></tr>';
    }
}

async function viewLabResult(id) {
    try {
        const lab = await apiRequest(`/laboratory/${id}`);
        // Show lab result modal
        console.log('Lab result:', lab.data);
    } catch (error) {
        showToast('Failed to load lab result', 'error');
    }
}

async function updateLabStatus(id) {
    const status = prompt('Enter new status (Pending/In Progress/Completed):');
    if (!status) return;

    try {
        await apiRequest(`/laboratory/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast('Lab status updated!', 'success');
        loadLabRequests();
    } catch (error) {
        showToast('Failed to update lab status', 'error');
    }
}

// ============================================
// PROFILE
// ============================================
async function loadProfile() {
    const user = getUser();
    if (!user) return;

    // Fill profile form
    document.getElementById('doctorName').value = user.fullName || '';
    document.getElementById('doctorEmail').value = user.email || '';
    document.getElementById('doctorPhone').value = user.phone || '';
    document.getElementById('doctorSpecialty').value = user.specialty || '';
    document.getElementById('doctorDepartment').value = user.department || '';
    document.getElementById('doctorId').value = user.employeeNumber || '';

    // Set avatar
    const avatar = document.getElementById('doctorAvatar');
    if (avatar) {
        avatar.textContent = user.fullName?.charAt(0) || 'D';
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const formData = {
        fullName: document.getElementById('doctorName').value,
        phone: document.getElementById('doctorPhone').value,
        specialty: document.getElementById('doctorSpecialty').value,
        department: document.getElementById('doctorDepartment').value,
    };

    try {
        const response = await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.data));
            showToast('Profile updated successfully!', 'success');
            loadProfile();
        }
    } catch (error) {
        showToast('Failed to update profile', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters!', 'error');
        return;
    }

    try {
        await apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        showToast('Password changed successfully!', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showToast('Failed to change password: ' + error.message, 'error');
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function searchPatients(query) {
    if (!query || query.length < 2) {
        loadPatients();
        return;
    }

    const container = document.getElementById('patientsContainer');
    if (!container) return;

    apiRequest(`/patients/search?q=${encodeURIComponent(query)}`)
        .then(response => {
            if (response?.data?.length > 0) {
                container.innerHTML = response.data.map(patient => `
                    <tr>
                        <td>${patient.fullName || 'Unknown'}</td>
                        <td>${patient.patientId || 'N/A'}</td>
                        <td>${patient.phone || 'N/A'}</td>
                        <td>${patient.lastVisit || 'Never'}</td>
                        <td>
                            <button onclick="viewPatient('${patient._id}')" class="btn-sm btn-info">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                container.innerHTML = '<tr><td colspan="5" class="empty-state">No patients found</td></tr>';
            }
        })
        .catch(() => {
            showToast('Search failed', 'error');
        });
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function setActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Set active nav
    setActiveNav();

    // Load page-specific content
    const page = window.location.pathname;

    if (page.includes('dashboard')) {
        loadDashboard();
    } else if (page.includes('appointments')) {
        loadAppointments();
    } else if (page.includes('patients')) {
        loadPatients();
    } else if (page.includes('consultations')) {
        loadConsultations();
    } else if (page.includes('prescriptions')) {
        loadPrescriptions();
    } else if (page.includes('lab-requests')) {
        loadLabRequests();
    } else if (page.includes('profile')) {
        loadProfile();

        // Profile forms
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', updateProfile);
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', changePassword);
        }
    }

    // Search functionality
    const searchInput = document.getElementById('searchPatients');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchPatients(this.value);
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.viewAppointment = viewAppointment;
window.startConsultation = startConsultation;
window.cancelAppointment = cancelAppointment;
window.viewPatient = viewPatient;
window.viewPatientHistory = viewPatientHistory;
window.addDiagnosis = addDiagnosis;
window.prescribeMedication = prescribeMedication;
window.completeConsultation = completeConsultation;
window.viewPrescription = viewPrescription;
window.refillPrescription = refillPrescription;
window.viewLabResult = viewLabResult;
window.updateLabStatus = updateLabStatus;
window.logout = logout;
window.searchPatients = searchPatients;
