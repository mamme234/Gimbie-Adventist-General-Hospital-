/**
 * ============================================
 * WARD.CONTROLLER.JS - Ward Controller
 * ============================================
 */

const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all wards
 */
const getWards = async (req, res) => {
  try {
    const { departmentId, type, isActive } = req.query;
    let query = {};
    if (departmentId) query.department = departmentId;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const wards = await Ward.find(query)
      .populate('department', 'name code')
      .populate('headNurse', 'nurseId')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: wards
    });
  } catch (error) {
    logger.error('Get wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wards',
      error: error.message
    });
  }
};

/**
 * Get ward by ID
 */
const getWardById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id)
      .populate('department', 'name code')
      .populate('headNurse', 'nurseId');

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ward
    });
  } catch (error) {
    logger.error('Get ward by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward',
      error: error.message
    });
  }
};

/**
 * Create ward (Admin only)
 */
const createWard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      name,
      departmentId,
      type,
      capacity,
      headNurse,
      location,
      facilities,
      operatingHours
    } = req.body;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const wardId = `WRD-${new Date().getFullYear()}-${String(await Ward.countDocuments() + 1).padStart(4, '0')}`;

    const ward = new Ward({
      wardId,
      name,
      department: departmentId,
      type: type || 'General',
      capacity: capacity || 10,
      headNurse,
      location,
      facilities: facilities || [],
      operatingHours: operatingHours || {
        monday: { open: '07:00', close: '20:00' },
        tuesday: { open: '07:00', close: '20:00' },
        wednesday: { open: '07:00', close: '20:00' },
        thursday: { open: '07:00', close: '20:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '07:00', close: '18:00' },
        sunday: { open: '07:00', close: '18:00' }
      },
      isActive: true
    });

    await ward.save();

    logger.info(`Ward created: ${ward.name} (${ward.wardId})`);

    res.status(201).json({
      success: true,
      message: 'Ward created successfully',
      data: ward
    });
  } catch (error) {
    logger.error('Create ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ward',
      error: error.message
    });
  }
};

/**
 * Update ward
 */
const updateWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    const {
      name,
      departmentId,
      type,
      capacity,
      headNurse,
      location,
      facilities,
      operatingHours,
      isActive
    } = req.body;

    if (name) ward.name = name;
    if (departmentId) ward.department = departmentId;
    if (type) ward.type = type;
    if (capacity) ward.capacity = capacity;
    if (headNurse) ward.headNurse = headNurse;
    if (location) ward.location = location;
    if (facilities) ward.facilities = facilities;
    if (operatingHours) ward.operatingHours = operatingHours;
    if (isActive !== undefined) ward.isActive = isActive;

    await ward.save();

    logger.info(`Ward updated: ${ward.name}`);

    res.status(200).json({
      success: true,
      message: 'Ward updated successfully',
      data: ward
    });
  } catch (error) {
    logger.error('Update ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ward',
      error: error.message
    });
  }
};

/**
 * Delete ward (Admin only)
 */
const deleteWard = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    ward.isActive = false;
    await ward.save();

    logger.info(`Ward deactivated: ${ward.name}`);

    res.status(200).json({
      success: true,
      message: 'Ward deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate ward',
      error: error.message
    });
  }
};

/**
 * Get ward patients
 */
const getWardPatients = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    const patients = await Patient.find({
      currentWard: ward._id,
      status: 'Active'
    }).populate('userId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    logger.error('Get ward patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward patients',
      error: error.message
    });
  }
};

/**
 * Get ward staff
 */
const getWardStaff = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Placeholder - would query staff assignment model
    const staff = {
      nurses: [],
      doctors: [],
      supportStaff: []
    };

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    logger.error('Get ward staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward staff',
      error: error.message
    });
  }
};

/**
 * Get ward beds
 */
const getWardBeds = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    const beds = await Bed.find({ ward: ward._id })
      .sort({ bedNumber: 1 });

    res.status(200).json({
      success: true,
      data: beds
    });
  } catch (error) {
    logger.error('Get ward beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward beds',
      error: error.message
    });
  }
};

/**
 * Get ward stats
 */
const getWardStats = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    const totalBeds = await Bed.countDocuments({ ward: ward._id });
    const occupiedBeds = await Bed.countDocuments({
      ward: ward._id,
      status: 'Occupied'
    });
    const availableBeds = totalBeds - occupiedBeds;

    res.status(200).json({
      success: true,
      data: {
        ward: ward.name,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get ward stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward stats',
      error: error.message
    });
  }
};

/**
 * Get available wards
 */
const getAvailableWards = async (req, res) => {
  try {
    const wards = await Ward.find({
      isActive: true
    });

    const availableWards = [];
    for (const ward of wards) {
      const totalBeds = await Bed.countDocuments({ ward: ward._id });
      const occupiedBeds = await Bed.countDocuments({
        ward: ward._id,
        status: 'Occupied'
      });
      const availableBeds = totalBeds - occupiedBeds;

      if (availableBeds > 0) {
        availableWards.push({
          ...ward.toObject(),
          availableBeds,
          totalBeds,
          occupiedBeds
        });
      }
    }

    res.status(200).json({
      success: true,
      data: availableWards
    });
  } catch (error) {
    logger.error('Get available wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available wards',
      error: error.message
    });
  }
};

/**
 * Assign patient to ward
 */
const assignPatientToWard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { patientId, bedId, admissionDate, notes } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const bed = await Bed.findById(bedId);
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

    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Assign patient to bed
    bed.status = 'Occupied';
    bed.patient = patientId;
    bed.assignedAt = new Date();
    bed.assignedBy = req.user._id;
    await bed.save();

    // Update patient
    patient.currentWard = ward._id;
    patient.currentBed = bed._id;
    patient.admissionDate = new Date(admissionDate);
    await patient.save();

    logger.info(`Patient ${patient.patientId} assigned to ward ${ward.name}, bed ${bed.bedNumber}`);

    res.status(200).json({
      success: true,
      message: 'Patient assigned to ward successfully',
      data: { patient, bed, ward }
    });
  } catch (error) {
    logger.error('Assign patient to ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign patient to ward',
      error: error.message
    });
  }
};

/**
 * Transfer patient
 */
const transferPatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { patientId, toWardId, toBedId, reason } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const fromWard = await Ward.findById(req.params.id);
    if (!fromWard) {
      return res.status(404).json({
        success: false,
        message: 'Source ward not found'
      });
    }

    const toWard = await Ward.findById(toWardId);
    if (!toWard) {
      return res.status(404).json({
        success: false,
        message: 'Destination ward not found'
      });
    }

    const toBed = await Bed.findById(toBedId);
    if (!toBed) {
      return res.status(404).json({
        success: false,
        message: 'Destination bed not found'
      });
    }

    if (toBed.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Destination bed is not available'
      });
    }

    // Release current bed
    const currentBed = await Bed.findById(patient.currentBed);
    if (currentBed) {
      currentBed.status = 'Available';
      currentBed.patient = null;
      currentBed.assignedAt = null;
      currentBed.assignedBy = null;
      await currentBed.save();
    }

    // Assign to new bed
    toBed.status = 'Occupied';
    toBed.patient = patientId;
    toBed.assignedAt = new Date();
    toBed.assignedBy = req.user._id;
    await toBed.save();

    // Update patient
    patient.currentWard = toWard._id;
    patient.currentBed = toBed._id;
    await patient.save();

    logger.info(`Patient ${patient.patientId} transferred from ${fromWard.name} to ${toWard.name}`);

    res.status(200).json({
      success: true,
      message: 'Patient transferred successfully',
      data: { patient, fromWard, toWard, toBed }
    });
  } catch (error) {
    logger.error('Transfer patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer patient',
      error: error.message
    });
  }
};

/**
 * Discharge patient from ward
 */
const dischargePatientFromWard = async (req, res) => {
  try {
    const { patientId, dischargeDate, reason } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Release bed
    const bed = await Bed.findById(patient.currentBed);
    if (bed) {
      bed.status = 'Available';
      bed.patient = null;
      bed.assignedAt = null;
      bed.assignedBy = null;
      await bed.save();
    }

    // Update patient
    patient.currentWard = null;
    patient.currentBed = null;
    patient.dischargeDate = new Date(dischargeDate);
    patient.status = 'Inactive';
    await patient.save();

    logger.info(`Patient ${patient.patientId} discharged from ward ${ward.name}`);

    res.status(200).json({
      success: true,
      message: 'Patient discharged from ward successfully',
      data: { patient, ward }
    });
  } catch (error) {
    logger.error('Discharge patient from ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discharge patient from ward',
      error: error.message
    });
  }
};

/**
 * Get ward occupancy
 */
const getWardOccupancy = async (req, res) => {
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
          name: ward.name,
          type: ward.type
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
    logger.error('Get ward occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward occupancy',
      error: error.message
    });
  }
};

/**
 * Get ward capacity
 */
const getWardCapacity = async (req, res) => {
  try {
    const totalCapacity = await Ward.aggregate([
      { $group: { _id: null, total: { $sum: '$capacity' } } }
    ]);

    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: 'Occupied' });

    res.status(200).json({
      success: true,
      data: {
        totalCapacity: totalCapacity[0]?.total || 0,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get ward capacity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward capacity',
      error: error.message
    });
  }
};

module.exports = {
  getWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  getWardPatients,
  getWardStaff,
  getWardBeds,
  getWardStats,
  getAvailableWards,
  assignPatientToWard,
  transferPatient,
  dischargePatientFromWard,
  getWardOccupancy,
  getWardCapacity
};
