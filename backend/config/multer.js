/**
 * ============================================
 * MULTER.JS - File Upload Configuration
 * ============================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * File upload configuration
 */
const uploadConfig = {
  // File size limits (in bytes)
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
  },

  // Allowed file types
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    medical: ['application/pdf', 'image/jpeg', 'image/png', 'application/dicom'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Maximum number of files
  maxFiles: 10,
};

/**
 * Create storage engine with dynamic path
 * @param {string} basePath - Base folder path
 * @returns {Object} Multer storage engine
 */
const createStorage = (basePath) => {
  // Ensure directory exists
  const fullPath = path.join(__dirname, '..', basePath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-uuid-originalname
      const uniqueSuffix = Date.now() + '-' + uuidv4();
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });
};

/**
 * File filter for validation
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Function} Multer file filter
 */
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

/**
 * Create multer instance for different upload types
 */
const multerConfig = {
  // Profile images
  profile: multer({
    storage: createStorage('uploads/profiles'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.image),
  }),

  // Medical records
  medical: multer({
    storage: createStorage('uploads/medical'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.medical),
  }),

  // Prescriptions
  prescription: multer({
    storage: createStorage('uploads/prescriptions'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.document),
  }),

  // Lab results
  lab: multer({
    storage: createStorage('uploads/lab-results'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.all),
  }),

  // Radiology images
  radiology: multer({
    storage: createStorage('uploads/radiology'),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB for medical images
    },
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'application/dicom']),
  }),

  // General upload
  general: multer({
    storage: createStorage('uploads/general'),
    limits: uploadConfig.limits,
    fileFilter: fileFilter(uploadConfig.allowedMimeTypes.all),
  }),
};

/**
 * Helper to handle multer errors
 * @param {Error} err - Multer error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
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
