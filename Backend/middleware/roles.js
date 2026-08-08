/**
 * Role Definitions
 * @desc    All available roles in the system
 */
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    PHARMACIST: 'pharmacist',
    LAB_TECHNICIAN: 'lab_technician',
    RADIOLOGIST: 'radiologist',
    ACCOUNTANT: 'accountant',
    RECEPTIONIST: 'receptionist',
    HR_MANAGER: 'hr_manager',
    INVENTORY_MANAGER: 'inventory_manager',
    PROCUREMENT_MANAGER: 'procurement_manager',
    PATIENT: 'patient',
};

/**
 * Permission Definitions
 * @desc    All available permissions and which roles have them
 */
const PERMISSIONS = {
    // Dashboard
    viewDashboard: ['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'accountant', 'hr_manager', 'inventory_manager', 'procurement_manager'],
    
    // Patients
    viewPatients: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'accountant'],
    createPatient: ['super_admin', 'admin', 'receptionist'],
    updatePatient: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
    deletePatient: ['super_admin', 'admin'],
    viewPatientRecords: ['super_admin', 'admin', 'doctor', 'nurse'],
    createPatientRecord: ['super_admin', 'admin', 'doctor', 'nurse'],
    updatePatientRecord: ['super_admin', 'admin', 'doctor', 'nurse'],
    deletePatientRecord: ['super_admin', 'admin'],
    
    // Appointments
    viewAppointments: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient'],
    createAppointment: ['super_admin', 'admin', 'receptionist', 'patient'],
    updateAppointment: ['super_admin', 'admin', 'doctor', 'receptionist'],
    deleteAppointment: ['super_admin', 'admin'],
    cancelAppointment: ['super_admin', 'admin', 'doctor', 'receptionist', 'patient'],
    confirmAppointment: ['super_admin', 'admin', 'receptionist'],
    completeAppointment: ['super_admin', 'admin', 'doctor'],
    
    // Medical
    createConsultation: ['super_admin', 'admin', 'doctor'],
    viewConsultations: ['super_admin', 'admin', 'doctor', 'nurse'],
    updateConsultation: ['super_admin', 'admin', 'doctor'],
    createPrescription: ['super_admin', 'admin', 'doctor'],
    viewPrescriptions: ['super_admin', 'admin', 'doctor', 'pharmacist', 'patient'],
    updatePrescription: ['super_admin', 'admin', 'doctor', 'pharmacist'],
    
    // Pharmacy
    viewPharmacy: ['super_admin', 'admin', 'pharmacist', 'doctor', 'nurse'],
    manageMedications: ['super_admin', 'admin', 'pharmacist'],
    createMedication: ['super_admin', 'admin', 'pharmacist'],
    updateMedication: ['super_admin', 'admin', 'pharmacist'],
    deleteMedication: ['super_admin', 'admin'],
    dispenseMedication: ['super_admin', 'admin', 'pharmacist'],
    viewStock: ['super_admin', 'admin', 'pharmacist'],
    manageStock: ['super_admin', 'admin', 'pharmacist'],
    
    // Laboratory
    viewLabTests: ['super_admin', 'admin', 'doctor', 'lab_technician', 'nurse'],
    createLabTest: ['super_admin', 'admin', 'doctor'],
    updateLabTest: ['super_admin', 'admin', 'lab_technician'],
    deleteLabTest: ['super_admin', 'admin'],
    processLabTest: ['super_admin', 'admin', 'lab_technician'],
    verifyLabTest: ['super_admin', 'admin', 'lab_technician'],
    viewLabResults: ['super_admin', 'admin', 'doctor', 'lab_technician', 'patient'],
    
    // Radiology
    viewRadiology: ['super_admin', 'admin', 'doctor', 'radiologist', 'nurse'],
    createRadiology: ['super_admin', 'admin', 'doctor'],
    updateRadiology: ['super_admin', 'admin', 'radiologist'],
    deleteRadiology: ['super_admin', 'admin'],
    processRadiology: ['super_admin', 'admin', 'radiologist'],
    viewRadiologyResults: ['super_admin', 'admin', 'doctor', 'radiologist', 'patient'],
    
    // Billing
    viewBilling: ['super_admin', 'admin', 'accountant', 'patient'],
    createInvoice: ['super_admin', 'admin', 'accountant'],
    updateInvoice: ['super_admin', 'admin', 'accountant'],
    deleteInvoice: ['super_admin', 'admin'],
    processPayment: ['super_admin', 'admin', 'accountant'],
    refundPayment: ['super_admin', 'admin', 'accountant'],
    viewInvoices: ['super_admin', 'admin', 'accountant', 'patient'],
    
    // Insurance
    viewInsurance: ['super_admin', 'admin', 'accountant', 'receptionist'],
    manageInsurance: ['super_admin', 'admin', 'accountant'],
    submitClaim: ['super_admin', 'admin', 'accountant'],
    verifyClaim: ['super_admin', 'admin', 'accountant'],
    
    // Staff
    viewStaff: ['super_admin', 'admin', 'hr_manager'],
    manageStaff: ['super_admin', 'admin', 'hr_manager'],
    createStaff: ['super_admin', 'admin', 'hr_manager'],
    updateStaff: ['super_admin', 'admin', 'hr_manager'],
    deleteStaff: ['super_admin', 'admin'],
    viewStaffRecords: ['super_admin', 'admin', 'hr_manager'],
    
    // Inventory
    viewInventory: ['super_admin', 'admin', 'inventory_manager', 'pharmacist'],
    manageInventory: ['super_admin', 'admin', 'inventory_manager'],
    createInventory: ['super_admin', 'admin', 'inventory_manager'],
    updateInventory: ['super_admin', 'admin', 'inventory_manager'],
    deleteInventory: ['super_admin', 'admin'],
    
    // Procurement
    viewProcurement: ['super_admin', 'admin', 'procurement_manager'],
    manageProcurement: ['super_admin', 'admin', 'procurement_manager'],
    createPurchaseOrder: ['super_admin', 'admin', 'procurement_manager'],
    approvePurchaseOrder: ['super_admin', 'admin', 'procurement_manager'],
    
    // Reports
    viewReports: ['super_admin', 'admin', 'accountant', 'hr_manager'],
    generateReports: ['super_admin', 'admin', 'accountant'],
    exportReports: ['super_admin', 'admin', 'accountant'],
    
    // Settings
    viewSettings: ['super_admin', 'admin'],
    manageSettings: ['super_admin', 'admin'],
    manageSystem: ['super_admin'],
    
    // Notifications
    viewNotifications: ['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'accountant', 'hr_manager', 'inventory_manager', 'procurement_manager', 'patient'],
    sendNotifications: ['super_admin', 'admin', 'doctor', 'nurse'],
    manageNotifications: ['super_admin', 'admin'],
};

/**
 * Check if role has a specific permission
 * @param   {string} role - User role
 * @param   {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
const checkPermission = (role, permission) => {
    const allowedRoles = PERMISSIONS[permission] || [];
    return allowedRoles.includes(role);
};

/**
 * Get all permissions for a role
 * @param   {string} role - User role
 * @returns {string[]} - Array of permissions
 */
const getPermissionsForRole = (role) => {
    const permissions = [];
    for (const [permission, roles] of Object.entries(PERMISSIONS)) {
        if (roles.includes(role)) {
            permissions.push(permission);
        }
    }
    return permissions;
};

/**
 * Check if role is a medical role (doctor, nurse)
 * @param   {string} role - User role
 * @returns {boolean} - True if role is medical
 */
const isMedicalRole = (role) => {
    const medicalRoles = ['doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist'];
    return medicalRoles.includes(role);
};

/**
 * Check if role is an administrative role
 * @param   {string} role - User role
 * @returns {boolean} - True if role is administrative
 */
const isAdminRole = (role) => {
    const adminRoles = ['super_admin', 'admin', 'accountant', 'hr_manager', 'inventory_manager', 'procurement_manager'];
    return adminRoles.includes(role);
};

/**
 * Get role hierarchy level (higher number = more permissions)
 * @param   {string} role - User role
 * @returns {number} - Role level
 */
const getRoleLevel = (role) => {
    const levels = {
        'super_admin': 100,
        'admin': 90,
        'doctor': 70,
        'nurse': 60,
        'pharmacist': 60,
        'lab_technician': 60,
        'radiologist': 60,
        'accountant': 50,
        'hr_manager': 50,
        'inventory_manager': 50,
        'procurement_manager': 50,
        'receptionist': 40,
        'patient': 10,
    };
    return levels[role] || 0;
};

module.exports = {
    ROLES,
    PERMISSIONS,
    checkPermission,
    getPermissionsForRole,
    isMedicalRole,
    isAdminRole,
    getRoleLevel,
};
