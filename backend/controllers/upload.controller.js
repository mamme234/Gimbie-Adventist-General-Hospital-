/**
 * ============================================
 * UPLOAD.CONTROLLER.JS - Upload Controller
 * ============================================
 */

const { multerConfig, handleMulterError } = require('../config/multer');
const { logger } = require('../config/logger');
const fs = require('fs');
const path = require('path');

/**
 * Upload profile image
 */
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`Profile image uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/profiles/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message
    });
  }
};

/**
 * Upload multiple profile images
 */
const uploadMultipleProfileImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/profiles/${file.filename}`
    }));

    logger.info(`Multiple profile images uploaded: ${files.length} files`);

    res.status(200).json({
      success: true,
      message: `${files.length} images uploaded successfully`,
      data: files
    });
  } catch (error) {
    logger.error('Upload multiple profile images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile images',
      error: error.message
    });
  }
};

/**
 * Upload medical record
 */
const uploadMedicalRecord = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`Medical record uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Medical record uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/medical/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('Upload medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload medical record',
      error: error.message
    });
  }
};

/**
 * Upload prescription
 */
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`Prescription uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/prescriptions/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('Upload prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload prescription',
      error: error.message
    });
  }
};

/**
 * Upload lab result
 */
const uploadLabResult = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`Lab result uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Lab result uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/lab-results/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('Upload lab result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload lab result',
      error: error.message
    });
  }
};

/**
 * Upload radiology image
 */
const uploadRadiologyImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/radiology/${file.filename}`
    }));

    logger.info(`Radiology images uploaded: ${files.length} files`);

    res.status(200).json({
      success: true,
      message: `${files.length} radiology images uploaded successfully`,
      data: files
    });
  } catch (error) {
    logger.error('Upload radiology image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload radiology images',
      error: error.message
    });
  }
};

/**
 * Upload general file
 */
const uploadGeneralFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    logger.info(`General file uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/general/${req.file.filename}`
      }
    });
  } catch (error) {
    logger.error('Upload general file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Upload multiple general files
 */
const uploadMultipleGeneralFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/general/${file.filename}`
    }));

    logger.info(`Multiple files uploaded: ${files.length} files`);

    res.status(200).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files
    });
  } catch (error) {
    logger.error('Upload multiple general files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};

/**
 * Delete file
 */
const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    fs.unlinkSync(fullPath);

    logger.info(`File deleted: ${filePath}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Get file info
 */
const getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);

    res.status(200).json({
      success: true,
      data: {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      }
    });
  } catch (error) {
    logger.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info',
      error: error.message
    });
  }
};

/**
 * Download file
 */
const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    logger.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};

/**
 * Upload chat attachment
 */
const uploadChatAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { chatId } = req.body;

    logger.info(`Chat attachment uploaded: ${req.file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Chat attachment uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/general/${req.file.filename}`,
        chatId
      }
    });
  } catch (error) {
    logger.error('Upload chat attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload chat attachment',
      error: error.message
    });
  }
};

/**
 * Upload gallery image
 */
const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { galleryId } = req.body;

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/uploads/gallery/${file.filename}`
    }));

    logger.info(`Gallery images uploaded: ${files.length} files`);

    res.status(200).json({
      success: true,
      message: `${files.length} gallery images uploaded successfully`,
      data: {
        galleryId,
        images: files
      }
    });
  } catch (error) {
    logger.error('Upload gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload gallery images',
      error: error.message
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadMultipleProfileImages,
  uploadMedicalRecord,
  uploadPrescription,
  uploadLabResult,
  uploadRadiologyImage,
  uploadGeneralFile,
  uploadMultipleGeneralFiles,
  deleteFile,
  getFileInfo,
  downloadFile,
  uploadChatAttachment,
  uploadGalleryImage
};
