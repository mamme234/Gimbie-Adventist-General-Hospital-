/**
 * Generate unique IDs for various entities in the hospital system
 */

/**
 * Generate Patient ID
 * Format: GAH-P-YYYY-XXXX
 * @returns {string} Patient ID
 */
const generatePatientId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-P-${year}-${random}`;
};

/**
 * Generate Appointment ID
 * Format: GAH-APP-YYYYMMDD-XXXX
 * @returns {string} Appointment ID
 */
const generateAppointmentId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-APP-${dateStr}-${random}`;
};

/**
 * Generate Invoice Number
 * Format: GAH-INV-YYYYMMDD-XXXX
 * @returns {string} Invoice Number
 */
const generateInvoiceNumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-INV-${dateStr}-${random}`;
};

/**
 * Generate Staff ID
 * Format: GAH-DEPT-XXX
 * @param {string} department - Department name
 * @returns {string} Staff ID
 */
const generateStaffId = (department) => {
    const deptMap = {
        'Administration': 'ADM',
        'Medical': 'DR',
        'Nursing': 'NUR',
        'Pharmacy': 'PHA',
        'Laboratory': 'LAB',
        'Radiology': 'RAD',
        'Finance': 'FIN',
        'HR': 'HR',
        'Inventory': 'INV',
        'Procurement': 'PRO',
        'OPD': 'OPD',
        'Inpatient': 'INP',
        'Emergency': 'EMR',
        'Health Information': 'HIS',
        'Community Outreach': 'COM',
        'Internal Medicine': 'IM',
        'Pediatrics': 'PED',
        'Surgery': 'SUR',
        'Obstetrics & Gynecology': 'OBG',
        'Cardiology': 'CAR',
        'Neurology': 'NEU',
        'Orthopedics': 'ORT',
        'Ophthalmology': 'OPH',
        'ENT': 'ENT',
        'Dermatology': 'DER',
        'Psychiatry': 'PSY',
        'Anesthesia': 'ANE',
    };
    const prefix = deptMap[department] || 'STA';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GAH-${prefix}-${random}`;
};

/**
 * Generate Bed Number
 * Format: BED-WARD-ROOM-NNN
 * @param {string} ward - Ward name
 * @param {string} room - Room number
 * @returns {string} Bed Number
 */
const generateBedNumber = (ward, room) => {
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const wardCode = ward.substring(0, 2).toUpperCase();
    return `BED-${wardCode}-${room}-${random}`;
};

/**
 * Generate Lab Test ID
 * Format: LAB-YYYYMMDD-XXXX
 * @returns {string} Lab Test ID
 */
const generateLabTestId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LAB-${dateStr}-${random}`;
};

/**
 * Generate Radiology ID
 * Format: RAD-YYYYMMDD-XXXX
 * @returns {string} Radiology ID
 */
const generateRadiologyId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RAD-${dateStr}-${random}`;
};

/**
 * Generate Medication ID
 * Format: MED-YYYYMMDD-XXXX
 * @returns {string} Medication ID
 */
const generateMedicationId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `MED-${dateStr}-${random}`;
};

/**
 * Generate Insurance ID
 * Format: INS-YYYYMMDD-XXXX
 * @returns {string} Insurance ID
 */
const generateInsuranceId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INS-${dateStr}-${random}`;
};

/**
 * Generate Inventory Item ID
 * Format: INV-YYYYMMDD-XXXX
 * @returns {string} Inventory Item ID
 */
const generateInventoryId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}`;
};

/**
 * Generate Notification ID
 * Format: NOT-YYYYMMDD-XXXX
 * @returns {string} Notification ID
 */
const generateNotificationId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NOT-${dateStr}-${random}`;
};

/**
 * Generate Purchase Order Number
 * Format: PO-YYYYMMDD-XXXX
 * @returns {string} Purchase Order Number
 */
const generatePONumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO-${dateStr}-${random}`;
};

/**
 * Generate Claim Number
 * Format: CLM-YYYYMMDD-XXXX
 * @returns {string} Claim Number
 */
const generateClaimNumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CLM-${dateStr}-${random}`;
};

/**
 * Generate Referral Number
 * Format: REF-YYYYMMDD-XXXX
 * @returns {string} Referral Number
 */
const generateReferralNumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REF-${dateStr}-${random}`;
};

/**
 * Generate Queue Number
 * Format: Q-XXX
 * @param {number} number - Queue number
 * @returns {string} Queue Number
 */
const generateQueueNumber = (number) => {
    return `Q-${String(number).padStart(3, '0')}`;
};

module.exports = {
    generatePatientId,
    generateAppointmentId,
    generateInvoiceNumber,
    generateStaffId,
    generateBedNumber,
    generateLabTestId,
    generateRadiologyId,
    generateMedicationId,
    generateInsuranceId,
    generateInventoryId,
    generateNotificationId,
    generatePONumber,
    generateClaimNumber,
    generateReferralNumber,
    generateQueueNumber,
};
