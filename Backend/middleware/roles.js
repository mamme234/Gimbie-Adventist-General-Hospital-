// Role definitions and permissions
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

const PERMISSIONS = {
    // Dashboard
    viewDashboard: ['super_admin', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'accountant'],
    
    // Patients
    viewPatients: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'accountant'],
    createPatient: ['super_admin', 'admin', 'receptionist'],
    updatePatient: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
    deletePatient: ['super_admin', 'admin'],
    viewPatientRecords: ['super_admin', 'admin', 'doctor', 'nurse'],
    
    // Appointments
    viewAppointments: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist'],
    createAppointment: ['super_admin', 'admin', 'receptionist', 'patient'],
    updateAppointment: ['super_admin', 'admin', 'doctor', 'receptionist'],
    deleteAppointment: ['super_admin', 'admin'],
    
    // Medical
    createConsultation: ['super_admin', 'admin', 'doctor'],
    viewConsultations: ['super_admin', 'admin', 'doctor', 'nurse'],
    createPrescription: ['super_admin', 'admin', 'doctor'],
    viewPrescriptions: ['super_admin', 'admin', 'doctor', 'pharmacist', 'patient'],
    
    // Pharmacy
    viewPharmacy: ['super_admin', 'admin', 'pharmacist', 'doctor'],
    manageMedications: ['super_admin', 'admin', 'pharmacist'],
    dispenseMedication: ['super_admin', 'admin', 'pharmacist'],
    
    // Laboratory
    viewLabTests: ['super_admin', 'admin', 'doctor', 'lab_technician'],
    createLabTest: ['super_admin', 'admin', 'doctor'],
    processLabTest: ['super_admin', 'admin', 'lab_technician'],
    verifyLabTest: ['super_admin', 'admin', 'lab_technician'],
    
    // Radiology
    viewRadiology: ['super_admin', 'admin', 'doctor', 'radiologist'],
    createRadiology: ['super_admin', 'admin', 'doctor'],
    processRadiology: ['super_admin', 'admin', 'radiologist'],
    
    // Billing
    viewBilling: ['super_admin', 'admin', 'accountant', 'patient'],
    createInvoice: ['super_admin', 'admin', 'accountant'],
    processPayment: ['super_admin', 'admin', 'accountant'],
    
    // Staff
    viewStaff: ['super_admin', 'admin', 'hr_manager'],
    manageStaff: ['super_admin', 'admin', 'hr_manager'],
    
    // Reports
    viewReports: ['super_admin', 'admin', 'accountant', 'hr_manager'],
    generateReports: ['super_admin', 'admin', 'accountant'],
    
    // Settings
    manageSettings: ['super_admin', 'admin'],
    manageSystem: ['super_admin'],
};

const checkPermission = (role, permission) => {
    const allowedRoles = PERMISSIONS[permission] || [];
    return allowedRoles.includes(role);
};

module.exports = { ROLES, PERMISSIONS, checkPermission };
