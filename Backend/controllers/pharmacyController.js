const Medication = require('../models/Medication');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// @desc    Get all medications
// @route   GET /api/pharmacy
// @access  Private
exports.getMedications = async (req, res) => {
    try {
        const { category, search, lowStock, page = 1, limit = 20 } = req.query;
        const query = { isActive: true };

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { medicationId: { $regex: search, $options: 'i' } },
            ];
        }
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
        }

        const medications = await Medication.find(query)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Medication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: medications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single medication
// @route   GET /api/pharmacy/:id
// @access  Private
exports.getMedication = async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id);
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        res.status(200).json({
            success: true,
            data: medication,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create medication
// @route   POST /api/pharmacy
// @access  Private
exports.createMedication = async (req, res) => {
    try {
        const medicationData = req.body;
        medicationData.medicationId = `MED-${Date.now()}`;
        
        const medication = await Medication.create(medicationData);
        res.status(201).json({
            success: true,
            data: medication,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update medication
// @route   PUT /api/pharmacy/:id
// @access  Private
exports.updateMedication = async (req, res) => {
    try {
        const medication = await Medication.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        res.status(200).json({
            success: true,
            data: medication,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete medication
// @route   DELETE /api/pharmacy/:id
// @access  Private
exports.deleteMedication = async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id);
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        medication.isActive = false;
        await medication.save();
        res.status(200).json({
            success: true,
            message: 'Medication deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get low stock medications
// @route   GET /api/pharmacy/low-stock
// @access  Private
exports.getLowStock = async (req, res) => {
    try {
        const medications = await Medication.getLowStock();
        res.status(200).json({
            success: true,
            data: medications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get expiring medications
// @route   GET /api/pharmacy/expiring
// @access  Private
exports.getExpiringMedications = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const medications = await Medication.getExpiringSoon(Number(days));
        res.status(200).json({
            success: true,
            data: medications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Dispense medication
// @route   PUT /api/pharmacy/:id/dispense
// @access  Private
exports.dispenseMedication = async (req, res) => {
    try {
        const { quantity, patientId, prescriptionId } = req.body;
        const medication = await Medication.findById(req.params.id);
        
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }

        await medication.reduceStock(quantity);

        // Create notification for patient
        if (patientId) {
            await Notification.create({
                notificationId: `NOT-${Date.now()}`,
                recipient: patientId,
                title: 'Prescription Dispensed',
                message: `Your prescription for ${medication.name} (${quantity} units) has been dispensed.`,
                type: 'Prescription',
                priority: 'Medium',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Medication dispensed successfully',
            data: medication,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Restock medication
// @route   PUT /api/pharmacy/:id/restock
// @access  Private
exports.restockMedication = async (req, res) => {
    try {
        const { quantity, batchNumber, expiryDate } = req.body;
        const medication = await Medication.findById(req.params.id);
        
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }

        medication.stockQuantity += quantity;
        if (batchNumber) medication.batchNumber = batchNumber;
        if (expiryDate) medication.expiryDate = new Date(expiryDate);
        medication.lastRestocked = new Date();
        
        // Update status
        if (medication.stockQuantity > medication.reorderLevel) {
            medication.status = 'Available';
        } else {
            medication.status = 'Low Stock';
        }

        await medication.save();

        res.status(200).json({
            success: true,
            data: medication,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Adjust stock
// @route   PUT /api/pharmacy/:id/adjust-stock
// @access  Private
exports.adjustStock = async (req, res) => {
    try {
        const { adjustment, reason } = req.body;
        const medication = await Medication.findById(req.params.id);
        
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }

        const newQuantity = medication.stockQuantity + adjustment;
        if (newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock cannot be negative',
            });
        }

        medication.stockQuantity = newQuantity;
        medication.notes = `Stock adjustment: ${reason || 'Manual adjustment'}`;
        
        if (medication.stockQuantity <= 0) {
            medication.status = 'Out of Stock';
        } else if (medication.stockQuantity <= medication.reorderLevel) {
            medication.status = 'Low Stock';
        } else {
            medication.status = 'Available';
        }

        await medication.save();

        res.status(200).json({
            success: true,
            data: medication,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get prescription queue
// @route   GET /api/pharmacy/queue
// @access  Private
exports.getPrescriptionQueue = async (req, res) => {
    try {
        // This would typically fetch from a Prescription model
        // For now, return a placeholder
        res.status(200).json({
            success: true,
            data: [],
            message: 'Prescription queue endpoint',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update prescription status
// @route   PUT /api/pharmacy/prescription/:id
// @access  Private
exports.updatePrescriptionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // This would typically update a Prescription model
        res.status(200).json({
            success: true,
            message: 'Prescription status updated',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get medication history
// @route   GET /api/pharmacy/:id/history
// @access  Private
exports.getMedicationHistory = async (req, res) => {
    try {
        // This would typically fetch from a Transaction model
        res.status(200).json({
            success: true,
            data: [],
            message: 'Medication history endpoint',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get pharmacy dashboard stats
// @route   GET /api/pharmacy/dashboard
// @access  Private
exports.getPharmacyDashboard = async (req, res) => {
    try {
        const totalMedications = await Medication.countDocuments({ isActive: true });
        const lowStock = await Medication.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
            isActive: true,
        });
        const outOfStock = await Medication.countDocuments({
            stockQuantity: 0,
            isActive: true,
        });
        
        // Get expiring soon (30 days)
        const expiringSoon = await Medication.countDocuments({
            expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            isActive: true,
        });

        res.status(200).json({
            success: true,
            data: {
                totalMedications,
                lowStock,
                outOfStock,
                expiringSoon,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
