const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./error');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'uploads/patients',
        'uploads/doctors',
        'uploads/staff',
        'uploads/documents',
        'uploads/lab',
        'uploads/radiology',
        'uploads/pharmacy',
        'uploads/profile',
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

/**
 * Configure storage for different file types
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        
        // Determine upload path based on file type
        if (file.fieldname === 'profileImage' || file.fieldname === 'avatar') {
            uploadPath = 'uploads/profile/';
        } else if (file.fieldname === 'patientDocument') {
            uploadPath = 'uploads/patients/';
        } else if (file.fieldname === 'doctorDocument') {
            uploadPath = 'uploads/doctors/';
        } else if (file.fieldname === 'staffDocument') {
            uploadPath = 'uploads/staff/';
        } else if (file.fieldname === 'labResult') {
            uploadPath = 'uploads/lab/';
        } else if (file.fieldname === 'radiologyImage') {
            uploadPath = 'uploads/radiology/';
        } else if (file.fieldname === 'prescription') {
            uploadPath = 'uploads/pharmacy/';
        } else if (file.fieldname === 'generalDocument') {
            uploadPath = 'uploads/documents/';
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/\s/g, '_');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

/**
 * File filter for allowed file types
 */
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    const allowedAllTypes = [...allowedImageTypes, ...allowedDocumentTypes];
    
    // Check file type
    if (allowedAllTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(`File type not allowed. Allowed types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, TXT`, 400), false);
    }
};

/**
 * Configure multer with limits
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10, // Max 10 files
    },
    fileFilter: fileFilter,
});

/**
 * Upload middleware for single file
 */
const uploadSingle = (fieldName) => {
    return upload.single(fieldName);
};

/**
 * Upload middleware for multiple files
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
    return upload.array(fieldName, maxCount);
};

/**
 * Upload middleware for multiple fields
 */
const uploadFields = (fields) => {
    return upload.fields(fields);
};

/**
 * Error handler for multer
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded.',
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.',
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next(err);
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadFields,
    handleUploadError,
};
