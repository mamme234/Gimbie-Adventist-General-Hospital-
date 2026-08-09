/**
 * Patient Module - All Patient Pages
 * Handles all patient functionality
 */

// ===== API URL =====
const API_URL = 'https://alpha-af1q.onrender.com/api';

// ===== UTILITY FUNCTIONS =====
function getAuthToken() {
    return localStorage.getItem('token');
}

function getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

function checkAuth() {
    const token = getAuthToken();
    const user = getUser();
    if (!token || !user) {
        window.location.href = '/pages/login.html';
        return null;
    }
    return user;
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(time) {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatCurrency(amount) {
    return `ETB ${(amount || 0).toFixed(2)}`;
}

function getStatusClass(status) {
    const map = {
        'Confirmed': 'confirmed',
        'Scheduled': 'scheduled',
        'Pending': 'pending',
        'Cancelled': 'cancelled',
        'Completed': 'completed',
        'Active': 'active',
        'Inactive': 'inactive'
    };
    return map[status] || 'scheduled';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
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

// ===== UPDATE USER INFO =====
function updateUserInfo(user) {
    const name = user.fullName || 'Patient';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const patientId = user.patientId || user.id || 'N/A';

    document.querySelectorAll('#patientName, #userName, #welcomeName, #profileName').forEach(el => {
        if (el) el.textContent = name;
    });
    document.querySelectorAll('#patientId, #profileId').forEach(el => {
        if (el) el.textContent = `ID: ${patientId}`;
    });
    document.querySelectorAll('#patientAvatar, #patientAvatarSmall, #profileAvatar').forEach(el => {
        if (el) el.textContent = initials;
    });

    // Profile page specific
    if (document.getElementById('profilePhone')) {
        document.getElementById('profilePhone').textContent = user.phone || 'N/A';
        document.getElementById('profileEmail').textContent = user.email || 'N/A';
        document.getElementById('profileBlood').textContent = user.bloodGroup || 'Unknown';
        document.getElementById('profileAge').textContent = user.age || 'N/A';
        
        document.getElementById('editName').value = user.fullName || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editDob').value = user.dob || '';
        document.getElementById('editBlood').value = user.bloodGroup || 'Unknown';
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    const user = checkAuth();
    if (!user) return;
    updateUserInfo(user);

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            const patient = data.data;
            
            // Stats
            const stats = [
                { icon: 'fa-calendar-check', number: patient.upcomingAppointments || 0, label: 'Upcoming Appointments', class: '' },
                { icon: 'fa-file-medical', number: patient.totalRecords || 0, label: 'Medical Records', class: 'stat-card--blue' },
                { icon: 'fa-prescription-bottle', number: patient.activePrescriptions || 0, label: 'Active Prescriptions', class: 'stat-card--orange' },
                { icon: 'fa-money-bill-wave', number: formatCurrency(patient.outstandingBalance || 0), label: 'Outstanding Balance', class: 'stat-card--red' }
            ];

            const statsContainer = document.getElementById('patientStats');
            if (statsContainer) {
                statsContainer.innerHTML = stats.map(s => `
                    <div class="stat-card ${s.class}">
                        <div class="stat-card__icon"><i class="fas ${s.icon}"></i></div>
                        <div class="stat-card__number">${s.number}</div>
                        <div class="stat-card__label">${s.label}</div>
                    </div>
                `).join('');
            }

            // Appointments
            await loadAppointments(patient._id);
            
            // Medical Records
            await loadMedicalRecords(patient._id);
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        showToast('Error loading dashboard', 'error');
    }
}

// ============================================
// APPOINTMENTS
// ============================================
async function loadAppointments(patientId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/${patientId}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const container = document.getElementById('appointmentsList');
        if (!container) return;

        if (data.success && data.data.length > 0) {
            const upcoming = data.data.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').slice(0, 5);
            container.innerHTML = upcoming.map(app => `
                <div class="appointment-item">
                    <div class="info">
                        <div class="doctor">${app.doctor?.userId?.fullName || 'Doctor'}</div>
                        <div class="date-time">${formatDate(app.date)} at ${formatTime(app.time)}</div>
                        <div class="department">${app.department || 'General'}</div>
                    </div>
                    <span class="status status--${getStatusClass(app.status)}">${app.status}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <h4>No Upcoming Appointments</h4>
                    <p>Book an appointment to get started</p>
                    <a href="/pages/appointments.html" class="btn btn--primary btn--small">Book Now</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Appointments error:', error);
    }
}

// ============================================
// MEDICAL RECORDS
// ============================================
async function loadMedicalRecords(patientId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/${patientId}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const container = document.getElementById('medicalRecords');
        if (!container) return;

        if (data.success && data.data.length > 0) {
            const recent = data.data.slice(0, 5);
            container.innerHTML = recent.map(record => `
                <div class="record-item">
                    <div class="icon"><i class="fas fa-file-medical-alt"></i></div>
                    <div class="info">
                        <div class="title">${record.diagnosis || 'Medical Record'}</div>
                        <div class="date">${formatDate(record.date)}</div>
                        <div class="doctor-name">${record.doctor || 'Doctor'}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-medical"></i>
                    <h4>No Medical Records</h4>
                    <p>Your records will appear here after your visits</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Medical records error:', error);
    }
}

// ============================================
// BILLING
// ============================================
async function loadBilling() {
    const user = checkAuth();
    if (!user) return;
    updateUserInfo(user);

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/${user.id}/bills`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const container = document.getElementById('billingList');
        if (!container) return;

        if (data.success && data.data.length > 0) {
            const invoices = data.data;
            let totalOutstanding = 0;
            let totalPaid = 0;

            invoices.forEach(inv => {
                if (inv.status === 'Pending' || inv.status === 'Partially Paid') {
                    totalOutstanding += inv.balance || 0;
                }
                if (inv.status === 'Paid') {
                    totalPaid += inv.paidAmount || 0;
                }
            });

            // Update summary
            document.getElementById('totalOutstanding').textContent = formatCurrency(totalOutstanding);
            document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
            document.getElementById('totalInvoices').textContent = invoices.length;
            document.getElementById('invoiceCount').textContent = `${invoices.length} invoices`;

            container.innerHTML = invoices.map(inv => `
                <div class="appointment-card">
                    <div class="info">
                        <div class="doctor">${inv.invoiceNumber}</div>
                        <div class="date-time">${formatDate(inv.createdAt)}</div>
                        <div class="department">${inv.items?.map(i => i.description).join(', ') || 'N/A'}</div>
                    </div>
                    <div class="right">
                        <span style="font-weight:600;font-size:1.1rem;">${formatCurrency(inv.total)}</span>
                        <span class="status status--${getStatusClass(inv.status)}">${inv.status}</span>
                        ${inv.status === 'Pending' || inv.status === 'Partially Paid' ? 
                            `<a href="/pages/patient/payment.html" class="btn btn--small btn--primary">Pay Now</a>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h4>No Invoices</h4>
                    <p>You have no invoices yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Billing error:', error);
    }
}

// ============================================
// PROFILE
// ============================================
async function loadProfile() {
    const user = checkAuth();
    if (!user) return;
    updateUserInfo(user);

    // Fetch patient details
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            const patient = data.data;
            document.getElementById('profileName').textContent = patient.fullName || 'Patient';
            document.getElementById('profileId').textContent = `ID: ${patient.patientId || 'N/A'}`;
            document.getElementById('profilePhone').textContent = patient.phone || 'N/A';
            document.getElementById('profileEmail').textContent = patient.email || 'N/A';
            document.getElementById('profileBlood').textContent = patient.bloodGroup || 'Unknown';
            document.getElementById('profileAge').textContent = patient.age || 'N/A';
            
            // Fill edit form
            document.getElementById('editName').value = patient.fullName || '';
            document.getElementById('editEmail').value = patient.email || '';
            document.getElementById('editPhone').value = patient.phone || '';
            document.getElementById('editDob').value = patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '';
            document.getElementById('editBlood').value = patient.bloodGroup || 'Unknown';
            
            // Avatar
            const initials = (patient.fullName || 'P').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            document.getElementById('profileAvatar').textContent = initials;
        }
    } catch (error) {
        console.error('Profile error:', error);
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const user = checkAuth();
    if (!user) return;

    const data = {
        fullName: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        dateOfBirth: document.getElementById('editDob').value,
        bloodGroup: document.getElementById('editBlood').value
    };

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showToast('Profile updated successfully!', 'success');
            // Update user in localStorage
            const userData = getUser();
            if (userData) {
                userData.fullName = data.fullName;
                userData.phone = data.phone;
                localStorage.setItem('user', JSON.stringify(userData));
            }
            setTimeout(() => loadProfile(), 500);
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showToast('Error updating profile', 'error');
    }
}

// ============================================
// LOGOUT
// ============================================
function handleLogout(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    }
}

// ============================================
// DROPDOWN
// ============================================
function toggleDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// ============================================
// INIT - Page Detection
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (!user) return;

    updateUserInfo(user);

    // Determine which page we're on
    const path = window.location.pathname;

    // Logout buttons
    document.querySelectorAll('#logoutBtn, #sidebarLogoutBtn').forEach(btn => {
        if (btn) btn.addEventListener('click', handleLogout);
    });

    // User dropdown
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', toggleDropdown);
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('active');
        });
    }

    // Load page specific content
    if (path.includes('dashboard.html') || path === '/pages/patient/' || path === '/') {
        loadDashboard();
    } else if (path.includes('billing.html')) {
        loadBilling();
    } else if (path.includes('profile.html')) {
        loadProfile();
        document.getElementById('profileForm')?.addEventListener('submit', updateProfile);
        document.getElementById('editProfileBtn')?.addEventListener('click', function() {
            document.getElementById('editProfileForm').style.display = 'block';
            this.style.display = 'none';
        });
        document.getElementById('cancelEditBtn')?.addEventListener('click', function() {
            document.getElementById('editProfileForm').style.display = 'none';
            document.getElementById('editProfileBtn').style.display = 'block';
        });
    }
});

// ===== EXPOSE GLOBALLY =====
window.loadDashboard = loadDashboard;
window.loadBilling = loadBilling;
window.loadProfile = loadProfile;
window.updateProfile = updateProfile;
window.handleLogout = handleLogout;
window.showToast = showToast;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatCurrency = formatCurrency;
