/**
 * ============================================
 * BED.CONTROLLER.JS - Bed Controller
 * ============================================
 */

const Bed = require('../models/Bed');
const Ward = require('../models/Ward');
const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all beds
 */
const getBeds = async (req, res) => {
  try {
    const { wardId, status, type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (wardId) query.ward = wardId;
    if (status) query.status = status;
    if (type) query.type = type;

    const beds = await Bed.find(query)
      .populate('ward', 'name department')
      .populate('patient', 'patientId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ ward: 1, bedNumber: 1 });

    const total = await Bed.countDocuments(query);

    res.status(200).json({
      success: true,
      data: beds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get beds',
      error: error.message
    });
  }
};

/**
 * Get bed by ID
 */
const getBedById = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('ward', 'name department')
      .populate('patient', 'patientId');

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bed
    });
  } catch (error) {
    logger.error('Get bed by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bed',
      error: error.message
    });
  }
};

/**
 * Create bed (Admin only)
 */
const createBed = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { wardId, bedNumber, type, features, notes } = req.body;

    const ward = await Ward.findById(wardId);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Check if bed number already exists in ward
    const existingBed = await Bed.findOne({ ward: wardId, bedNumber });
    if (existingBed) {
      return res.status(409).json({
        success: false,
        message: 'Bed number already exists in this ward'
      });
    }

    const bedId = `BED-${new Date().getFullYear()}-${String(await Bed.countDocuments() + 1).padStart(4, '0')}`;

    const bed = new Bed({
      bedId,
      ward: wardId,
      bedNumber,
      type: type || 'General',
      features: features || [],
      notes,
      status: 'Available'
    });

    await bed.save();

    logger.info(`Bed created: ${bed.bedId} (${bed.bedNumber}) in ward ${ward.name}`);

    res.status(201).json({
      success: true,
      message: 'Bed created successfully',
      data: bed
    });
  } catch (error) {
    logger.error('Create bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bed',
      error: error.message
    });
  }
};

/**
 * Update bed
 */
const updateBed = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    const { bedNumber, type, features, status, notes } = req.body;

    if (bedNumber) bed.bedNumber = bedNumber;
    if (type) bed.type = type;
    if (features) bed.features = features;
    if (status) bed.status = status;
    if (notes) bed.notes = notes;

    await bed.save();

    logger.info(`Bed updated: ${bed.bedId}`);

    res.status(200).json({
      success: true,
      message: 'Bed updated successfully',
      data: bed
    });
  } catch (error) {
    logger.error('Update bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bed',
      error: error.message
    });
  }
};

/**
 * Delete bed (Admin only)
 */
const deleteBed = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied bed'
      });
    }

    await bed.remove();

    logger.info(`Bed deleted: ${bed.bedId}`);

    res.status(200).json({
      success: true,
      message: 'Bed deleted successfully'
    });
  } catch (error) {
    logger.error('Delete bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bed',
      error: error.message
    });
  }
};

/**
 * Get available beds
 */
const getAvailableBeds = async (req, res) => {
  try {
    const { wardId, type } = req.query;

    let query = { status: 'Available' };
    if (wardId) query.ward = wardId;
    if (type) query.type = type;

    const beds = await Bed.find(query)
      .populate('ward', 'name department')
      .sort({ ward: 1, bedNumber: 1 });

    res.status(200).json({
      success: true,
      data: beds
    });
  } catch (error) {
    logger.error('Get available beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available beds',
      error: error.message
    });
  }
};

/**
 * Get occupied beds
 */
const getOccupiedBeds = async (req, res) => {
  try {
    const { wardId } = req.query;

    let query = { status: 'Occupied' };
    if (wardId) query.ward = wardId;

    const beds = await Bed.find(query)
      .populate('ward', 'name department')
      .populate('patient', 'patientId')
      .sort({ ward: 1, bedNumber: 1 });

    res.status(200).json({
      success: true,
      data: beds
    });
  } catch (error) {
    logger.error('Get occupied beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get occupied beds',
      error: error.message
    });
  }
};

/**
 * Get beds by ward
 */
const getBedsByWard = async (req, res) => {
  try {
    const { wardId } = req.params;

    const beds = await Bed.find({ ward: wardId })
      .populate('patient', 'patientId')
      .sort({ bedNumber: 1 });

    res.status(200).json({
      success: true,
      data: beds
    });
  } catch (error) {
    logger.error('Get beds by ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get beds by ward',
      error: error.message
    });
  }
};

/**
 * Get beds by department
 */
const getBedsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const wards = await Ward.find({ department: departmentId });
    const wardIds = wards.map(w => w._id);

    const beds = await Bed.find({ ward: { $in: wardIds } })
      .populate('ward', 'name')
      .populate('patient', 'patientId')
      .sort({ ward: 1, bedNumber: 1 });

    res.status(200).json({
      success: true,
      data: beds
    });
  } catch (error) {
    logger.error('Get beds by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get beds by department',
      error: error.message
    });
  }
};

/**
 * Assign patient to bed
 */
const assignPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bed.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available'
      });
    }

    const { patientId, admissionDate, notes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient is already assigned to another bed
    if (patient.currentBed) {
      const currentBed = await Bed.findById(patient.currentBed);
      if (currentBed) {
        currentBed.status = 'Available';
        currentBed.patient = null;
        currentBed.assignedAt = null;
        currentBed.assignedBy = null;
        await currentBed.save();
      }
    }

    bed.status = 'Occupied';
    bed.patient = patientId;
    bed.assignedAt = new Date();
    bed.assignedBy = req.user._id;
    bed.notes = notes || bed.notes;
    await bed.save();

    patient.currentBed = bed._id;
    patient.admissionDate = new Date(admissionDate);
    await patient.save();

    logger.info(`Patient ${patient.patientId} assigned to bed ${bed.bedId}`);

    res.status(200).json({
      success: true,
      message: 'Patient assigned to bed successfully',
      data: { bed, patient }
    });
  } catch (error) {
    logger.error('Assign patient to bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign patient to bed',
      error: error.message
    });
  }
};

/**
 * Discharge patient from bed
 */
const dischargePatient = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bed.status !== 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not occupied'
      });
    }

    const patient = await Patient.findById(bed.patient);
    if (patient) {
      patient.currentBed = null;
      patient.dischargeDate = new Date();
      await patient.save();
    }

    bed.status = 'Available';
    bed.patient = null;
    bed.assignedAt = null;
    bed.assignedBy = null;
    await bed.save();

    logger.info(`Patient discharged from bed ${bed.bedId}`);

    res.status(200).json({
      success: true,
      message: 'Patient discharged from bed successfully',
      data: bed
    });
  } catch (error) {
    logger.error('Discharge patient from bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discharge patient from bed',
      error: error.message
    });
  }
};

/**
 * Mark bed for maintenance
 */
const markBedMaintenance = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark occupied bed for maintenance'
      });
    }

    const { reason, estimatedReturn } = req.body;

    bed.status = 'Maintenance';
    bed.maintenanceReason = reason;
    bed.estimatedReturn = estimatedReturn ? new Date(estimatedReturn) : null;
    await bed.save();

    logger.info(`Bed ${bed.bedId} marked for maintenance`);

    res.status(200).json({
      success: true,
      message: 'Bed marked for maintenance successfully',
      data: bed
    });
  } catch (error) {
    logger.error('Mark bed maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark bed for maintenance',
      error: error.message
    });
  }
};

/**
 * Mark bed available
 */
const markBedAvailable = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    bed.status = 'Available';
    bed.maintenanceReason = null;
    bed.estimatedReturn = null;
    await bed.save();

    logger.info(`Bed ${bed.bedId} marked as available`);

    res.status(200).json({
      success: true,
      message: 'Bed marked as available successfully',
      data: bed
    });
  } catch (error) {
    logger.error('Mark bed available error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark bed as available',
      error: error.message
    });
  }
};

/**
 * Get bed stats
 */
const getBedStats = async (req, res) => {
  try {
    const [
      total,
      available,
      occupied,
      maintenance,
      reserved
    ] = await Promise.all([
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'Available' }),
      Bed.countDocuments({ status: 'Occupied' }),
      Bed.countDocuments({ status: 'Maintenance' }),
      Bed.countDocuments({ status: 'Reserved' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        available,
        occupied,
        maintenance,
        reserved,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get bed stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bed stats',
      error: error.message
    });
  }
};

/**
 * Get bed occupancy
 */
const getBedOccupancy = async (req, res) => {
  try {
    const wards = await Ward.find({ isActive: true });

    const occupancyData = [];
    for (const ward of wards) {
      const totalBeds = await Bed.countDocuments({ ward: ward._id });
      const occupiedBeds = await Bed.countDocuments({
        ward: ward._id,
        status: 'Occupied'
      });

      occupancyData.push({
        ward: {
          id: ward._id,
          name: ward.name
        },
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      });
    }

    res.status(200).json({
      success: true,
      data: occupancyData
    });
  } catch (error) {
    logger.error('Get bed occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bed occupancy',
      error: error.message
    });
  }
};

module.exports = {
  getBeds,
  getBedById,
  createBed,
  updateBed,
  deleteBed,
  getAvailableBeds,
  getOccupiedBeds,
  getBedsByWard,
  getBedsByDepartment,
  assignPatient,
  dischargePatient,
  markBedMaintenance,
  markBedAvailable,
  getBedStats,
  getBedOccupancy
};
