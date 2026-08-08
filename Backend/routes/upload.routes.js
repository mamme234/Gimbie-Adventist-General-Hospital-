/**
 * ============================================
 * UPLOAD.ROUTES.JS - File Upload Routes
 * ============================================
 */

const express = require('express');
const { multerConfig, handleMulterError } = require('../config/multer');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Profile image upload
router.post('/profile', multerConfig.profile.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Profile image uploaded successfully',
    file: req.file,
    url: `/uploads/profiles/${req.file.filename}`,
  });
});

// Multiple profile images
router.post('/profile/multiple', multerConfig.profile.array('images', 5), handleMulterError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }
  res.json({
    success: true,
    message: `${req.files.length} images uploaded successfully`,
    files: req.files.map(f => ({
      url: `/uploads/profiles/${f.filename}`,
      filename: f.filename,
      size: f.size,
    })),
  });
});

// Medical records upload
router.post('/medical', multerConfig.medical.single('file'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Medical record uploaded successfully',
    file: req.file,
    url: `/uploads/medical/${req.file.filename}`,
  });
});

// Prescription upload
router.post('/prescription', multerConfig.prescription.single('file'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Prescription uploaded successfully',
    file: req.file,
    url: `/uploads/prescriptions/${req.file.filename}`,
  });
});

// Lab results upload
router.post('/lab', authorize('admin', 'lab_technician'), multerConfig.lab.single('file'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Lab result uploaded successfully',
    file: req.file,
    url: `/uploads/lab-results/${req.file.filename}`,
  });
});

// Radiology images upload
router.post('/radiology', authorize('admin', 'radiologist', 'doctor'), multerConfig.radiology.array('images', 10), handleMulterError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }
  res.json({
    success: true,
    message: `${req.files.length} radiology images uploaded successfully`,
    files: req.files.map(f => ({
      url: `/uploads/radiology/${f.filename}`,
      filename: f.filename,
      size: f.size,
    })),
  });
});

// General upload
router.post('/general', multerConfig.general.single('file'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: req.file,
    url: `/uploads/general/${req.file.filename}`,
  });
});

// Multiple general files
router.post('/general/multiple', multerConfig.general.array('files', 10), handleMulterError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
    });
  }
  res.json({
    success: true,
    message: `${req.files.length} files uploaded successfully`,
    files: req.files.map(f => ({
      url: `/uploads/general/${f.filename}`,
      filename: f.filename,
      size: f.size,
    })),
  });
});

module.exports = router;
