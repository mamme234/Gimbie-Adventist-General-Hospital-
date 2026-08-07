// config/multer.js - FIXED
/**
 * ============================================
 * MULTER.JS - File Upload Configuration
 * ============================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Generate unique ID without uuid dependency
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

/**
 * File upload configuration
 */
const uploadConfig = {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    medical: ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  maxFiles: 10,
};

/**
 * Create storage engine with dynamic path
 */
const createStorage = (basePath) => {
  const fullPath = path.join(__dirname, '..', basePath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + generateId();
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
  });
};

/**
 * File filter for validation
 */
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
    }
  };
};

/**
 * Create multer instances
 */
const multerConfig = {
  profile: multer({
    storage: createStorage('uploads/profiles'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.image),
  }),
  medical: multer({
    storage: createStorage('uploads/medical'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.medical),
  }),
  prescription: multer({
    storage: createStorage('uploads/prescriptions'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.document),
  }),
  lab: multer({
    storage: createStorage('uploads/lab-results'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.all),
  }),
  radiology: multer({
    storage: createStorage('uploads/radiology'),
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'application/dicom']),
  }),
  general: multer({
    storage: createStorage('uploads/general'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.all),
  }),
};

/**
 * Handle multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const errorMessages = {
      'FILE_TOO_LARGE': `File too large. Maximum size is ${uploadConfig.limits.fileSize / 1024 / 1024}MB.`,
      'LIMIT_FILE_COUNT': 'Too many files uploaded.',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field.',
    };
    return res.status(400).json({
      success: false,
      message: errorMessages[err.code] || err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = {
  uploadConfig,
  multerConfig,
  handleMulterError,
};
