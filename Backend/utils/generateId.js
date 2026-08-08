const { v4: uuidv4 } = require('uuid');

const generatePatientId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-P-${year}-${random}`;
};

const generateAppointmentId = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-APP-${dateStr}-${random}`;
};

const generateInvoiceNumber = () => {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `GAH-INV-${dateStr}-${random}`;
};

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
    };
    const prefix = deptMap[department] || 'STA';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GAH-${prefix}-${random}`;
};

const generateBedNumber = (ward, room) => {
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `BED-${ward.substring(0, 2).toUpperCase()}-${room}-${random}`;
};

module.exports = {
    generatePatientId,
    generateAppointmentId,
    generateInvoiceNumber,
    generateStaffId,
    generateBedNumber,
};
