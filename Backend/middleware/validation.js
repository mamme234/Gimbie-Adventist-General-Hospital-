const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware - Check for validation errors
 * @desc    Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = errors.array().map(err => ({
        field: err.param,
        message: err.msg,
    }));
    
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: extractedErrors,
    });
};

/**
 * User validation rules
 */
const userValidation = {
    register: [
        body('fullName')
            .notEmpty().withMessage('Full name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('phone')
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Please provide a valid phone number'),
        body('role')
            .optional()
            .isIn(['doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'accountant', 'receptionist', 'hr_manager', 'inventory_manager', 'procurement_manager', 'patient'])
            .withMessage('Invalid role'),
    ],
    login: [
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required'),
    ],
    updateProfile: [
        body('fullName')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
        body('phone')
            .optional()
            .isMobilePhone().withMessage('Please provide a valid phone number'),
    ],
    changePassword: [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    ],
    forgotPassword: [
        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
    ],
    resetPassword: [
        body('token')
            .notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    ],
};

/**
 * Patient validation rules
 */
const patientValidation = {
    create: [
        body('fullName')
            .notEmpty().withMessage('Full name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
        body('dateOfBirth')
            .notEmpty().withMessage('Date of birth is required')
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                const date = new Date(value);
                if (date > new Date()) {
                    throw new Error('Date of birth cannot be in the future');
                }
                return true;
            }),
        body('gender')
            .notEmpty().withMessage('Gender is required')
            .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
        body('phone')
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Please provide a valid phone number'),
        body('email')
            .optional()
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('bloodGroup')
            .optional()
            .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']).withMessage('Invalid blood group'),
    ],
    update: [
        body('fullName')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
        body('dateOfBirth')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                const date = new Date(value);
                if (date > new Date()) {
                    throw new Error('Date of birth cannot be in the future');
                }
                return true;
            }),
        body('gender')
            .optional()
            .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
        body('phone')
            .optional()
            .isMobilePhone().withMessage('Please provide a valid phone number'),
        body('email')
            .optional()
            .isEmail().withMessage('Please provide a valid email address')
            .normalizeEmail(),
    ],
};

/**
 * Appointment validation rules
 */
const appointmentValidation = {
    create: [
        body('patient')
            .notEmpty().withMessage('Patient ID is required')
            .isMongoId().withMessage('Invalid patient ID'),
        body('doctor')
            .notEmpty().withMessage('Doctor ID is required')
            .isMongoId().withMessage('Invalid doctor ID'),
        body('date')
            .notEmpty().withMessage('Date is required')
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                const date = new Date(value);
                if (date < new Date()) {
                    throw new Error('Date cannot be in the past');
                }
                return true;
            }),
        body('time')
            .notEmpty().withMessage('Time is required')
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
        body('type')
            .optional()
            .isIn(['New Patient', 'Follow-up', 'Emergency', 'Consultation', 'Routine Check-up']).withMessage('Invalid appointment type'),
        body('priority')
            .optional()
            .isIn(['Low', 'Medium', 'High', 'Emergency']).withMessage('Invalid priority'),
    ],
    update: [
        body('date')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value) => {
                const date = new Date(value);
                if (date < new Date()) {
                    throw new Error('Date cannot be in the past');
                }
                return true;
            }),
        body('time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
        body('status')
            .optional()
            .isIn(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'Rescheduled']).withMessage('Invalid status'),
    ],
};

/**
 * Medication validation rules
 */
const medicationValidation = {
    create: [
        body('name')
            .notEmpty().withMessage('Medication name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
        body('category')
            .notEmpty().withMessage('Category is required')
            .isIn(['Antibiotics', 'Analgesics', 'Antipyretics', 'Antihistamines', 'Antidepressants', 'Antidiabetics', 'Antihypertensives', 'Anticoagulants', 'Anticonvulsants', 'Antivirals', 'Antifungals', 'Antiparasitics', 'Vitamins', 'Supplements', 'IV Fluids', 'Topical', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Neurological', 'Psychiatric', 'Other'])
            .withMessage('Invalid category'),
        body('form')
            .notEmpty().withMessage('Form is required')
            .isIn(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Inhaler', 'IV Fluid', 'Suspension', 'Other'])
            .withMessage('Invalid form'),
        body('strength')
            .notEmpty().withMessage('Strength is required'),
        body('stockQuantity')
            .optional()
            .isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
        body('reorderLevel')
            .optional()
            .isInt({ min: 0 }).withMessage('Reorder level must be a positive number'),
        body('costPrice')
            .optional()
            .isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
        body('sellingPrice')
            .optional()
            .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
    ],
};

/**
 * Lab test validation rules
 */
const labTestValidation = {
    create: [
        body('patient')
            .notEmpty().withMessage('Patient ID is required')
            .isMongoId().withMessage('Invalid patient ID'),
        body('doctor')
            .notEmpty().withMessage('Doctor ID is required')
            .isMongoId().withMessage('Invalid doctor ID'),
        body('testName')
            .notEmpty().withMessage('Test name is required'),
        body('category')
            .notEmpty().withMessage('Category is required')
            .isIn(['Hematology', 'Biochemistry', 'Microbiology', 'Serology', 'Immunology', 'Urinalysis', 'Stool Analysis', 'Hormone', 'Tumor Markers', 'Genetic', 'Histopathology', 'Cytology', 'Other'])
            .withMessage('Invalid category'),
        body('sampleType')
            .notEmpty().withMessage('Sample type is required')
            .isIn(['Blood', 'Urine', 'Stool', 'CSF', 'Sputum', 'Tissue', 'Swab', 'Bone Marrow', 'Pleural Fluid', 'Other'])
            .withMessage('Invalid sample type'),
        body('priority')
            .optional()
            .isIn(['Routine', 'Urgent', 'Emergency']).withMessage('Invalid priority'),
    ],
};

/**
 * Invoice validation rules
 */
const invoiceValidation = {
    create: [
        body('patient')
            .notEmpty().withMessage('Patient ID is required')
            .isMongoId().withMessage('Invalid patient ID'),
        body('items')
            .isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.description')
            .notEmpty().withMessage('Item description is required'),
        body('items.*.category')
            .notEmpty().withMessage('Item category is required')
            .isIn(['Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Procedure', 'Admission', 'Surgery', 'Emergency', 'Other'])
            .withMessage('Invalid category'),
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('items.*.unitPrice')
            .isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
        body('discount')
            .optional()
            .isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
        body('tax')
            .optional()
            .isFloat({ min: 0 }).withMessage('Tax must be a positive number'),
    ],
    payment: [
        body('amount')
            .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('method')
            .notEmpty().withMessage('Payment method is required')
            .isIn(['Cash', 'Card', 'Bank Transfer', 'Telebirr', 'Insurance', 'Other'])
            .withMessage('Invalid payment method'),
        body('reference')
            .optional(),
    ],
};

/**
 * Common validation rules
 */
const commonValidation = {
    id: [
        param('id')
            .isMongoId().withMessage('Invalid ID format'),
    ],
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    ],
    search: [
        query('q')
            .optional()
            .isLength({ min: 1 }).withMessage('Search query must not be empty'),
    ],
    dateRange: [
        query('startDate')
            .optional()
            .isISO8601().withMessage('Invalid start date format'),
        query('endDate')
            .optional()
            .isISO8601().withMessage('Invalid end date format')
            .custom((value, { req }) => {
                if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
    ],
};

module.exports = {
    validate,
    userValidation,
    patientValidation,
    appointmentValidation,
    medicationValidation,
    labTestValidation,
    invoiceValidation,
    commonValidation,
};
