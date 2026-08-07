/**
 * ============================================
 * EMERGENCY.CONTROLLER.JS - Emergency Controller
 * ============================================
 */

const EmergencyCase = require('../models/EmergencyCase');
const Triage = require('../models/Triage');
const Ambulance = require('../models/Ambulance');
const EmergencyTeam = require('../models/EmergencyTeam');
const EmergencyAlert = require('../models/EmergencyAlert');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

/**
 * Get all emergency cases
 */
const getCases = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.arrivalTime = { $gte: startDate, $lte: endDate };
    }

    const cases = await EmergencyCase.find(query)
      .populate('patient', 'patientId')
      .populate('triage', 'level bloodPressure heartRate temperature')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmergencyCase.countDocuments(query);

    res.status(200).json({
      success: true,
      data: cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get emergency cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency cases',
      error: error.message
    });
  }
};

/**
 * Get emergency case by ID
 */
const getCaseById = async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('triage')
      .populate('assignedDoctor', 'doctorId specialty')
      .populate('assignedNurse', 'nurseId');

    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    res.status(200).json({
      success: true,
      data: emergencyCase
    });
  } catch (error) {
    logger.error('Get emergency case by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency case',
      error: error.message
    });
  }
};

/**
 * Create emergency case
 */
const createCase = async (req, res) => {
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
      patientId,
      chiefComplaint,
      severity,
      arrivalMode,
      arrivalTime,
      assignedDoctor,
      assignedNurse,
      notes
    } = req.body;

    let patient = null;
    if (patientId) {
      patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
    }

    const caseId = `EMC-${new Date().getFullYear()}-${String(await EmergencyCase.countDocuments() + 1).padStart(4, '0')}`;

    const emergencyCase = new EmergencyCase({
      caseId,
      patient: patientId || null,
      chiefComplaint,
      severity,
      arrivalMode,
      arrivalTime: arrivalTime || new Date(),
      assignedDoctor,
      assignedNurse,
      notes,
      status: 'Triage',
      triageStatus: 'Pending'
    });

    await emergencyCase.save();

    // Send alert to emergency team
    if (severity === 'Critical' || severity === 'Severe') {
      sendNotification('emergency-team', {
        type: 'EMERGENCY_ALERT',
        caseId: emergencyCase.caseId,
        severity,
        message: `New emergency case: ${chiefComplaint}`,
        timestamp: new Date()
      });
    }

    logger.info(`Emergency case created: ${emergencyCase.caseId}`);

    res.status(201).json({
      success: true,
      message: 'Emergency case created successfully',
      data: emergencyCase
    });
  } catch (error) {
    logger.error('Create emergency case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency case',
      error: error.message
    });
  }
};

/**
 * Update emergency case
 */
const updateCase = async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    const {
      status,
      severity,
      assignedDoctor,
      assignedNurse,
      notes,
      diagnosis,
      treatment,
      outcome
    } = req.body;

    if (status) emergencyCase.status = status;
    if (severity) emergencyCase.severity = severity;
    if (assignedDoctor) emergencyCase.assignedDoctor = assignedDoctor;
    if (assignedNurse) emergencyCase.assignedNurse = assignedNurse;
    if (notes) emergencyCase.notes = notes;
    if (diagnosis) emergencyCase.diagnosis = diagnosis;
    if (treatment) emergencyCase.treatment = treatment;
    if (outcome) emergencyCase.outcome = outcome;

    if (status === 'Discharged') {
      emergencyCase.dischargeTime = new Date();
    }

    await emergencyCase.save();

    logger.info(`Emergency case updated: ${emergencyCase.caseId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency case updated successfully',
      data: emergencyCase
    });
  } catch (error) {
    logger.error('Update emergency case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency case',
      error: error.message
    });
  }
};

/**
 * Delete emergency case
 */
const deleteCase = async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    emergencyCase.status = 'Archived';
    await emergencyCase.save();

    logger.info(`Emergency case archived: ${emergencyCase.caseId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency case archived successfully'
    });
  } catch (error) {
    logger.error('Delete emergency case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive emergency case',
      error: error.message
    });
  }
};

/**
 * Get active cases
 */
const getActiveCases = async (req, res) => {
  try {
    const cases = await EmergencyCase.find({
      status: { $nin: ['Discharged', 'Archived'] }
    })
      .populate('patient', 'patientId')
      .populate('triage')
      .sort({ severity: -1, arrivalTime: 1 });

    res.status(200).json({
      success: true,
      data: cases
    });
  } catch (error) {
    logger.error('Get active cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active cases',
      error: error.message
    });
  }
};

/**
 * Get triage cases
 */
const getTriageCases = async (req, res) => {
  try {
    const cases = await EmergencyCase.find({
      triageStatus: 'Pending'
    })
      .populate('patient', 'patientId')
      .sort({ severity: -1, arrivalTime: 1 });

    res.status(200).json({
      success: true,
      data: cases
    });
  } catch (error) {
    logger.error('Get triage cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get triage cases',
      error: error.message
    });
  }
};

/**
 * Create triage
 */
const createTriage = async (req, res) => {
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
      caseId,
      level,
      bloodPressure,
      heartRate,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      painScore,
      notes,
      nurseId
    } = req.body;

    const emergencyCase = await EmergencyCase.findById(caseId);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    const triage = new Triage({
      case: caseId,
      level,
      bloodPressure,
      heartRate,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      painScore,
      notes,
      nurse: nurseId || req.user._id,
      triagedAt: new Date()
    });

    await triage.save();

    // Update case with triage
    emergencyCase.triage = triage._id;
    emergencyCase.triageStatus = 'Completed';
    emergencyCase.status = 'Waiting';
    await emergencyCase.save();

    logger.info(`Triage created for case: ${emergencyCase.caseId}`);

    res.status(201).json({
      success: true,
      message: 'Triage created successfully',
      data: triage
    });
  } catch (error) {
    logger.error('Create triage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create triage',
      error: error.message
    });
  }
};

/**
 * Update triage
 */
const updateTriage = async (req, res) => {
  try {
    const triage = await Triage.findById(req.params.id);
    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage not found'
      });
    }

    const {
      level,
      bloodPressure,
      heartRate,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      painScore,
      notes
    } = req.body;

    if (level) triage.level = level;
    if (bloodPressure) triage.bloodPressure = bloodPressure;
    if (heartRate) triage.heartRate = heartRate;
    if (temperature) triage.temperature = temperature;
    if (oxygenSaturation) triage.oxygenSaturation = oxygenSaturation;
    if (respiratoryRate) triage.respiratoryRate = respiratoryRate;
    if (painScore) triage.painScore = painScore;
    if (notes) triage.notes = notes;

    await triage.save();

    logger.info(`Triage updated: ${triage._id}`);

    res.status(200).json({
      success: true,
      message: 'Triage updated successfully',
      data: triage
    });
  } catch (error) {
    logger.error('Update triage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update triage',
      error: error.message
    });
  }
};

/**
 * Get triage by case
 */
const getTriageByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const triage = await Triage.findOne({ case: caseId });

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage not found for this case'
      });
    }

    res.status(200).json({
      success: true,
      data: triage
    });
  } catch (error) {
    logger.error('Get triage by case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get triage',
      error: error.message
    });
  }
};

/**
 * Get ambulances
 */
const getAmbulances = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const ambulances = await Ambulance.find(query)
      .populate('driver', 'firstName lastName phone')
      .populate('currentDispatch')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: ambulances
    });
  } catch (error) {
    logger.error('Get ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulances',
      error: error.message
    });
  }
};

/**
 * Get ambulance by ID
 */
const getAmbulanceById = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id)
      .populate('driver', 'firstName lastName phone')
      .populate('currentDispatch');

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ambulance
    });
  } catch (error) {
    logger.error('Get ambulance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance',
      error: error.message
    });
  }
};

/**
 * Create ambulance
 */
const createAmbulance = async (req, res) => {
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
      vehicleNumber,
      type,
      driverId,
      phone,
      capacity,
      equipment,
      location
    } = req.body;

    const ambulanceId = `AMB-${new Date().getFullYear()}-${String(await Ambulance.countDocuments() + 1).padStart(4, '0')}`;

    const ambulance = new Ambulance({
      ambulanceId,
      vehicleNumber,
      type,
      driver: driverId,
      phone,
      capacity: capacity || 2,
      equipment: equipment || [],
      location: location || { lat: 0, lng: 0 },
      status: 'Available'
    });

    await ambulance.save();

    logger.info(`Ambulance created: ${ambulance.ambulanceId}`);

    res.status(201).json({
      success: true,
      message: 'Ambulance created successfully',
      data: ambulance
    });
  } catch (error) {
    logger.error('Create ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ambulance',
      error: error.message
    });
  }
};

/**
 * Update ambulance
 */
const updateAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    const {
      vehicleNumber,
      type,
      driverId,
      phone,
      capacity,
      equipment,
      location,
      status
    } = req.body;

    if (vehicleNumber) ambulance.vehicleNumber = vehicleNumber;
    if (type) ambulance.type = type;
    if (driverId) ambulance.driver = driverId;
    if (phone) ambulance.phone = phone;
    if (capacity) ambulance.capacity = capacity;
    if (equipment) ambulance.equipment = equipment;
    if (location) ambulance.location = location;
    if (status) ambulance.status = status;

    await ambulance.save();

    logger.info(`Ambulance updated: ${ambulance.ambulanceId}`);

    res.status(200).json({
      success: true,
      message: 'Ambulance updated successfully',
      data: ambulance
    });
  } catch (error) {
    logger.error('Update ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance',
      error: error.message
    });
  }
};

/**
 * Delete ambulance
 */
const deleteAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    ambulance.status = 'Out of Service';
    await ambulance.save();

    logger.info(`Ambulance deactivated: ${ambulance.ambulanceId}`);

    res.status(200).json({
      success: true,
      message: 'Ambulance deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate ambulance',
      error: error.message
    });
  }
};

/**
 * Dispatch ambulance
 */
const dispatchAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    if (ambulance.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Ambulance is not available for dispatch'
      });
    }

    const { caseId, location, priority, notes } = req.body;

    const emergencyCase = await EmergencyCase.findById(caseId);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    ambulance.status = 'On Dispatch';
    ambulance.currentDispatch = {
      case: caseId,
      location: location || ambulance.location,
      dispatchedAt: new Date(),
      priority: priority || 'Normal',
      eta: null,
      notes
    };
    await ambulance.save();

    // Update case with ambulance
    emergencyCase.ambulance = ambulance._id;
    emergencyCase.status = 'Ambulance En Route';
    await emergencyCase.save();

    logger.info(`Ambulance dispatched: ${ambulance.ambulanceId} to case: ${emergencyCase.caseId}`);

    res.status(200).json({
      success: true,
      message: 'Ambulance dispatched successfully',
      data: ambulance
    });
  } catch (error) {
    logger.error('Dispatch ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch ambulance',
      error: error.message
    });
  }
};

/**
 * Update ambulance location
 */
const updateAmbulanceLocation = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    const { lat, lng, speed, heading } = req.body;

    ambulance.location = { lat, lng };
    if (speed !== undefined) ambulance.currentDispatch.speed = speed;
    if (heading !== undefined) ambulance.currentDispatch.heading = heading;

    // Update ETA if case has destination
    if (ambulance.currentDispatch && ambulance.currentDispatch.case) {
      const emergencyCase = await EmergencyCase.findById(ambulance.currentDispatch.case);
      if (emergencyCase && emergencyCase.location) {
        // Calculate ETA based on distance
        // Placeholder logic
        ambulance.currentDispatch.eta = '10 min';
      }
    }

    await ambulance.save();

    // Broadcast location update
    sendNotification('ambulance-tracking', {
      ambulanceId: ambulance.ambulanceId,
      location: { lat, lng },
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Ambulance location updated',
      data: ambulance
    });
  } catch (error) {
    logger.error('Update ambulance location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ambulance location',
      error: error.message
    });
  }
};

/**
 * Get available ambulances
 */
const getAvailableAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({
      status: 'Available'
    }).populate('driver', 'firstName lastName phone');

    res.status(200).json({
      success: true,
      data: ambulances
    });
  } catch (error) {
    logger.error('Get available ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available ambulances',
      error: error.message
    });
  }
};

/**
 * Get active ambulances
 */
const getActiveAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({
      status: 'On Dispatch'
    }).populate('driver', 'firstName lastName phone');

    res.status(200).json({
      success: true,
      data: ambulances
    });
  } catch (error) {
    logger.error('Get active ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active ambulances',
      error: error.message
    });
  }
};

/**
 * Get emergency team
 */
const getEmergencyTeam = async (req, res) => {
  try {
    const team = await EmergencyTeam.find()
      .populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Get emergency team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency team',
      error: error.message
    });
  }
};

/**
 * Get team member by ID
 */
const getTeamMemberById = async (req, res) => {
  try {
    const member = await EmergencyTeam.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error('Get team member by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team member',
      error: error.message
    });
  }
};

/**
 * Create team member
 */
const createTeamMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { userId, role, specialization, availability } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const member = new EmergencyTeam({
      user: userId,
      role,
      specialization,
      availability: availability || {},
      status: 'Active'
    });

    await member.save();

    logger.info(`Emergency team member created: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: member
    });
  } catch (error) {
    logger.error('Create team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team member',
      error: error.message
    });
  }
};

/**
 * Update team member
 */
const updateTeamMember = async (req, res) => {
  try {
    const member = await EmergencyTeam.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    const { role, specialization, availability, status } = req.body;

    if (role) member.role = role;
    if (specialization) member.specialization = specialization;
    if (availability) member.availability = availability;
    if (status) member.status = status;

    await member.save();

    logger.info(`Emergency team member updated: ${member._id}`);

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: member
    });
  } catch (error) {
    logger.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member',
      error: error.message
    });
  }
};

/**
 * Delete team member
 */
const deleteTeamMember = async (req, res) => {
  try {
    const member = await EmergencyTeam.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    member.status = 'Inactive';
    await member.save();

    logger.info(`Emergency team member deactivated: ${member._id}`);

    res.status(200).json({
      success: true,
      message: 'Team member deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate team member',
      error: error.message
    });
  }
};

/**
 * Get team availability
 */
const getTeamAvailability = async (req, res) => {
  try {
    const team = await EmergencyTeam.find({
      status: 'Active'
    }).populate('user', 'firstName lastName');

    const availability = team.map(member => ({
      name: `${member.user.firstName} ${member.user.lastName}`,
      role: member.role,
      specialization: member.specialization,
      isAvailable: member.availability.isAvailable || false
    }));

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Get team availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team availability',
      error: error.message
    });
  }
};

/**
 * Get emergency stats
 */
const getEmergencyStats = async (req, res) => {
  try {
    const [
      totalCases,
      activeCases,
      criticalCases,
      todayCases
    ] = await Promise.all([
      EmergencyCase.countDocuments(),
      EmergencyCase.countDocuments({ status: { $nin: ['Discharged', 'Archived'] } }),
      EmergencyCase.countDocuments({ severity: 'Critical' }),
      EmergencyCase.countDocuments({
        arrivalTime: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCases,
        activeCases,
        criticalCases,
        todayCases
      }
    });
  } catch (error) {
    logger.error('Get emergency stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      casesToday,
      triagedToday,
      dischargedToday,
      ambulanceCalls
    ] = await Promise.all([
      EmergencyCase.countDocuments({ arrivalTime: { $gte: today, $lt: tomorrow } }),
      Triage.countDocuments({ triagedAt: { $gte: today, $lt: tomorrow } }),
      EmergencyCase.countDocuments({
        dischargeTime: { $gte: today, $lt: tomorrow }
      }),
      Ambulance.countDocuments({
        'currentDispatch.dispatchedAt': { $gte: today, $lt: tomorrow }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        casesToday,
        triagedToday,
        dischargedToday,
        ambulanceCalls
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      casesMonth,
      dischargedMonth,
      criticalCasesMonth
    ] = await Promise.all([
      EmergencyCase.countDocuments({ arrivalTime: { $gte: startOfMonth, $lt: endOfMonth } }),
      EmergencyCase.countDocuments({
        dischargeTime: { $gte: startOfMonth, $lt: endOfMonth }
      }),
      EmergencyCase.countDocuments({
        severity: 'Critical',
        arrivalTime: { $gte: startOfMonth, $lt: endOfMonth }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        casesMonth,
        dischargedMonth,
        criticalCasesMonth
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

/**
 * Get response time stats
 */
const getResponseTimeStats = async (req, res) => {
  try {
    // Calculate average response time from completed cases
    const cases = await EmergencyCase.find({
      status: 'Discharged',
      responseTime: { $exists: true }
    });

    const avgResponseTime = cases.reduce((acc, c) => acc + c.responseTime, 0) / cases.length || 0;

    res.status(200).json({
      success: true,
      data: {
        averageResponseTime: Math.round(avgResponseTime),
        totalCases: cases.length
      }
    });
  } catch (error) {
    logger.error('Get response time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response time stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate emergency reports
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

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * Get alerts
 */
const getAlerts = async (req, res) => {
  try {
    const { resolved } = req.query;
    let query = {};
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await EmergencyAlert.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
};

/**
 * Create alert
 */
const createAlert = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { title, message, priority, target } = req.body;

    const alert = new EmergencyAlert({
      title,
      message,
      priority: priority || 'Medium',
      target: target || 'All',
      createdAt: new Date(),
      resolved: false
    });

    await alert.save();

    // Send notification to target
    sendNotification(target || 'emergency-team', {
      type: 'NEW_ALERT',
      alertId: alert._id,
      title,
      message,
      priority
    });

    logger.info(`Emergency alert created: ${alert._id}`);

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message
    });
  }
};

/**
 * Update alert
 */
const updateAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    const { title, message, priority } = req.body;
    if (title) alert.title = title;
    if (message) alert.message = message;
    if (priority) alert.priority = priority;

    await alert.save();

    logger.info(`Emergency alert updated: ${alert._id}`);

    res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      data: alert
    });
  } catch (error) {
    logger.error('Update alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert',
      error: error.message
    });
  }
};

/**
 * Resolve alert
 */
const resolveAlert = async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    await alert.save();

    logger.info(`Emergency alert resolved: ${alert._id}`);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getActiveCases,
  getTriageCases,
  createTriage,
  updateTriage,
  getTriageByCase,
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  dispatchAmbulance,
  updateAmbulanceLocation,
  getAvailableAmbulances,
  getActiveAmbulances,
  getEmergencyTeam,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamAvailability,
  getEmergencyStats,
  getDailyStats,
  getMonthlyStats,
  getResponseTimeStats,
  getReports,
  generateReport,
  getAlerts,
  createAlert,
  updateAlert,
  resolveAlert
};
