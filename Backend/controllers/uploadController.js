const path = require('path');
const fs = require('fs');

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                url: fileUrl,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all files
// @route   GET /api/upload
// @access  Private
exports.getFiles = async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        const files = fs.readdirSync(uploadDir);
        const fileData = files.map(filename => {
            const stats = fs.statSync(path.join(uploadDir, filename));
            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
            };
        });

        res.status(200).json({
            success: true,
            data: fileData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single file
// @route   GET /api/upload/:id
// @access  Private
exports.getFile = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../uploads', req.params.id);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete file
// @route   DELETE /api/upload/:id
// @access  Private
exports.deleteFile = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../uploads', req.params.id);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
            });
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient files
// @route   GET /api/upload/patient/:patientId
// @access  Private
exports.getPatientFiles = async (req, res) => {
    try {
        const patientDir = path.join(__dirname, '../uploads/patients', req.params.patientId);
        if (!fs.existsSync(patientDir)) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        const files = fs.readdirSync(patientDir);
        const fileData = files.map(filename => {
            const stats = fs.statSync(path.join(patientDir, filename));
            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime,
            };
        });

        res.status(200).json({
            success: true,
            data: fileData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
