// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(file.fieldname);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitized}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    medical: ['application/dicom', 'image/dicom'],
    archive: ['application/zip', 'application/x-rar-compressed']
  };

  const allAllowed = Object.values(allowedTypes).flat();
  
  if (!allAllowed.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }

  cb(null, true);
};

// Helper function to get upload path
function getUploadPath(fieldname) {
  const basePath = process.env.UPLOAD_PATH || './uploads';
  const paths = {
    image: 'images',
    document: 'documents',
    video: 'videos',
    audio: 'audio',
    medical: 'medical',
    avatar: 'avatars',
    receipt: 'receipts',
    attachment: 'attachments',
    default: 'other'
  };
  
  return path.join(basePath, paths[fieldname] || paths.default);
}

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: parseInt(process.env.MAX_FILES) || 5
  }
});

// Upload middleware variants
const uploadMiddleware = {
  // Single file upload
  single: (fieldName) => upload.single(fieldName),

  // Multiple files upload
  array: (fieldName, maxCount) => upload.array(fieldName, maxCount),

  // Mixed fields upload
  fields: (fields) => upload.fields(fields),

  // Medical image upload with validation
  medicalImage: (req, res, next) => {
    upload.single('medicalImage')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          code: 'UPLOAD_ERROR'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded.',
          code: 'NO_FILE'
        });
      }

      // Validate DICOM if needed
      if (req.file.mimetype === 'application/dicom') {
        // Add DICOM validation here
        validateDICOM(req.file.path);
      }

      // Add file info to request
      req.uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/uploads/${path.basename(req.file.path)}`
      };

      next();
    });
  },

  // Avatar upload
  avatar: (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          code: 'UPLOAD_ERROR'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file uploaded.',
          code: 'NO_FILE'
        });
      }

      // Validate image dimensions
      const imageSize = require('image-size');
      try {
        const dimensions = imageSize(req.file.path);
        if (dimensions.width !== dimensions.height) {
          return res.status(400).json({
            success: false,
            message: 'Avatar must be square (width = height).',
            code: 'AVATAR_NOT_SQUARE'
          });
        }
        if (dimensions.width < 100 || dimensions.height < 100) {
          return res.status(400).json({
            success: false,
            message: 'Avatar must be at least 100x100 pixels.',
            code: 'AVATAR_TOO_SMALL'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image file.',
          code: 'INVALID_IMAGE'
        });
      }

      req.uploadedFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/uploads/${path.basename(req.file.path)}`
      };

      next();
    });
  },

  // Handle upload errors
  handleError: (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(413).json({
          success: false,
          message: `File too large. Max size: ${process.env.MAX_FILE_SIZE || '10MB'}`,
          code: 'FILE_TOO_LARGE'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: `Too many files. Max: ${process.env.MAX_FILES || 5}`,
          code: 'TOO_MANY_FILES'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          code: 'UNEXPECTED_FILE'
        });
      }
    }
    
    next(err);
  }
};

module.exports = uploadMiddleware;
