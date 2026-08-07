/**
 * ============================================
 * NURSE.CONTROLLER.JS - Nurse Controller
 * ============================================
 */

const Nurse = require('../models/Nurse');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all nurses
 */
const getNurses = async (req, res) => {
  try {
    const { page = 1, limit = 20, ward, position } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (ward) query.ward = ward;
    if (position) query.position = position;

    const nurses = await Nurse.find(query)
      .populate('userId', 'firstName lastName email phone profileImage')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Nurse.countDocuments(query);

    res.status(200).json({
      success: true,
      data: nurses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get nurses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nurses',
      error: error.message
    });
  }
};

/**
 * Get nurse by ID
 */
const getNurseById = async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage');

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    res.status(200).json({
      success: true,
      data: nurse
    });
  } catch (error) {
    logger.error('Get nurse by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nurse',
      error: error.message
    });
  }
};

/**
 * Get my profile (Nurse)
 */
const getMyProfile = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phone profileImage');

    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: nurse
    });
  } catch (error) {
    logger.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Create nurse (Admin only)
 */
const createNurse = async (req, res) => {
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
      firstName,
      lastName,
      email,
      phone,
      ward,
      position,
      specialization,
      qualifications,
      shift,
      assignedPatients
    } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: tempPassword,
        role: 'nurse'
      });
      await user.save();
    }

    const existingNurse = await Nurse.findOne({ userId: user._id });
    if (existingNurse) {
      return res.status(409).json({
        success: false,
        message: 'Nurse already exists for this user'
      });
    }

    const nurseId = `NUR-${new Date().getFullYear()}-${String(await Nurse.countDocuments() + 1).padStart(4, '0')}`;

    const nurse = new Nurse({
      userId: user._id,
      nurseId,
      ward,
      position,
      specialization,
      qualifications,
      shift: shift || 'Day',
      assignedPatients
    });

    await nurse.save();

    logger.info(`Nurse created: ${nurse.nurseId}`);

    res.status(201).json({
      success: true,
      message: 'Nurse created successfully',
      data: nurse
    });
  } catch (error) {
    logger.error('Create nurse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create nurse',
      error: error.message
    });
  }
};

/**
 * Update nurse
 */
const updateNurse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    const {
      ward,
      position,
      specialization,
      qualifications,
      shift,
      assignedPatients,
      status
    } = req.body;

    if (ward) nurse.ward = ward;
    if (position) nurse.position = position;
    if (specialization) nurse.specialization = specialization;
    if (qualifications) nurse.qualifications = qualifications;
    if (shift) nurse.shift = shift;
    if (assignedPatients) nurse.assignedPatients = assignedPatients;
    if (status) nurse.status = status;

    await nurse.save();

    logger.info(`Nurse updated: ${nurse.nurseId}`);

    res.status(200).json({
      success: true,
      message: 'Nurse updated successfully',
      data: nurse
    });
  } catch (error) {
    logger.error('Update nurse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update nurse',
      error: error.message
    });
  }
};

/**
 * Delete nurse (Admin only)
 */
const deleteNurse = async (req, res) => {
  try {
    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    nurse.status = 'Inactive';
    await nurse.save();

    logger.info(`Nurse deactivated: ${nurse.nurseId}`);

    res.status(200).json({
      success: true,
      message: 'Nurse deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete nurse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete nurse',
      error: error.message
    });
  }
};

/**
 * Get patients (Nurse's assigned patients)
 */
const getPatients = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user._id });
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    const patients = await Patient.find({
      assignedNurse: nurse._id
    }).populate('userId', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message
    });
  }
};

/**
 * Get assigned patients
 */
const getAssignedPatients = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user._id });
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    const patients = await Patient.find({
      assignedNurse: nurse._id,
      status: 'Active'
    }).populate('userId', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    logger.error('Get assigned patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assigned patients',
      error: error.message
    });
  }
};

/**
 * Get wards
 */
const getWards = async (req, res) => {
  try {
    // Placeholder - would query Ward model
    const wards = [
      { id: 'ward1', name: 'Ward 2A', department: 'Cardiology', beds: 12, occupied: 10 },
      { id: 'ward2', name: 'Ward 3B', department: 'Neurology', beds: 10, occupied: 7 },
      { id: 'ward3', name: 'ICU', department: 'ICU', beds: 8, occupied: 6 }
    ];

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
 * Get admissions
 */
const getAdmissions = async (req, res) => {
  try {
    // Placeholder - would query Admission model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get admissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admissions',
      error: error.message
    });
  }
};

/**
 * Create admission
 */
const createAdmission = async (req, res) => {
  try {
    // Placeholder - would create Admission
    res.status(201).json({
      success: true,
      message: 'Admission created successfully'
    });
  } catch (error) {
    logger.error('Create admission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admission',
      error: error.message
    });
  }
};

/**
 * Update admission
 */
const updateAdmission = async (req, res) => {
  try {
    // Placeholder - would update Admission
    res.status(200).json({
      success: true,
      message: 'Admission updated successfully'
    });
  } catch (error) {
    logger.error('Update admission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admission',
      error: error.message
    });
  }
};

/**
 * Get discharges
 */
const getDischarges = async (req, res) => {
  try {
    // Placeholder - would query Discharge model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get discharges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discharges',
      error: error.message
    });
  }
};

/**
 * Create discharge
 */
const createDischarge = async (req, res) => {
  try {
    // Placeholder - would create Discharge
    res.status(201).json({
      success: true,
      message: 'Discharge created successfully'
    });
  } catch (error) {
    logger.error('Create discharge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discharge',
      error: error.message
    });
  }
};

/**
 * Update discharge
 */
const updateDischarge = async (req, res) => {
  try {
    // Placeholder - would update Discharge
    res.status(200).json({
      success: true,
      message: 'Discharge updated successfully'
    });
  } catch (error) {
    logger.error('Update discharge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update discharge',
      error: error.message
    });
  }
};

/**
 * Get medications
 */
const getMedications = async (req, res) => {
  try {
    // Placeholder - would query Medication model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get medications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medications',
      error: error.message
    });
  }
};

/**
 * Administer medication
 */
const administerMedication = async (req, res) => {
  try {
    // Placeholder - would create MedicationAdmin
    res.status(201).json({
      success: true,
      message: 'Medication administered successfully'
    });
  } catch (error) {
    logger.error('Administer medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to administer medication',
      error: error.message
    });
  }
};

/**
 * Get vital signs
 */
const getVitalSigns = async (req, res) => {
  try {
    // Placeholder - would query VitalSigns model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get vital signs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vital signs',
      error: error.message
    });
  }
};

/**
 * Record vital signs
 */
const recordVitalSigns = async (req, res) => {
  try {
    // Placeholder - would create VitalSigns
    res.status(201).json({
      success: true,
      message: 'Vital signs recorded successfully'
    });
  } catch (error) {
    logger.error('Record vital signs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vital signs',
      error: error.message
    });
  }
};

/**
 * Get nursing notes
 */
const getNursingNotes = async (req, res) => {
  try {
    // Placeholder - would query NursingNote model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get nursing notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nursing notes',
      error: error.message
    });
  }
};

/**
 * Create nursing note
 */
const createNursingNote = async (req, res) => {
  try {
    // Placeholder - would create NursingNote
    res.status(201).json({
      success: true,
      message: 'Nursing note created successfully'
    });
  } catch (error) {
    logger.error('Create nursing note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create nursing note',
      error: error.message
    });
  }
};

/**
 * Get shift schedule
 */
const getShiftSchedule = async (req, res) => {
  try {
    const nurse = await Nurse.findOne({ userId: req.user._id });
    if (!nurse) {
      return res.status(404).json({
        success: false,
        message: 'Nurse not found'
      });
    }

    // Placeholder - would return actual shift schedule
    res.status(200).json({
      success: true,
      data: {
        currentShift: nurse.shift || 'Day',
        schedule: []
      }
    });
  } catch (error) {
    logger.error('Get shift schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shift schedule',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
};

module.exports = {
  getNurses,
  getNurseById,
  getMyProfile,
  createNurse,
  updateNurse,
  deleteNurse,
  getPatients,
  getAssignedPatients,
  getWards,
  getAdmissions,
  createAdmission,
  updateAdmission,
  getDischarges,
  createDischarge,
  updateDischarge,
  getMedications,
  administerMedication,
  getVitalSigns,
  recordVitalSigns,
  getNursingNotes,
  createNursingNote,
  getShiftSchedule,
  getReports
};
