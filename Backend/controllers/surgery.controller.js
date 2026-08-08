/**
 * ============================================
 * SURGERY.CONTROLLER.JS - Surgery Controller
 * ============================================
 */

const Surgery = require('../models/Surgery');
const SurgeryType = require('../models/SurgeryType');
const OperatingTheatre = require('../models/OperatingTheatre');
const SurgeryTeam = require('../models/SurgeryTeam');
const SurgeryNote = require('../models/SurgeryNote');
const PreOpAssessment = require('../models/PreOpAssessment');
const PostOpCare = require('../models/PostOpCare');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all surgeries
 */
const getSurgeries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, surgeonId, patientId, date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (surgeonId) query.surgeon = surgeonId;
    if (patientId) query.patient = patientId;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const surgeries = await Surgery.find(query)
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .populate('team', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1, time: 1 });

    const total = await Surgery.countDocuments(query);

    res.status(200).json({
      success: true,
      data: surgeries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgeries',
      error: error.message
    });
  }
};

/**
 * Get surgery by ID
 */
const getSurgeryById = async (req, res) => {
  try {
    const surgery = await Surgery.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .populate('team', 'name')
      .populate('preOpAssessment')
      .populate('postOpCare');

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    res.status(200).json({
      success: true,
      data: surgery
    });
  } catch (error) {
    logger.error('Get surgery by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery',
      error: error.message
    });
  }
};

/**
 * Create surgery
 */
const createSurgery = async (req, res) => {
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
      surgeryType,
      surgeonId,
      date,
      time,
      theatreId,
      priority,
      teamId,
      estimatedDuration,
      notes,
      preOpInstructions
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const surgeon = await Doctor.findById(surgeonId);
    if (!surgeon) {
      return res.status(404).json({
        success: false,
        message: 'Surgeon not found'
      });
    }

    const theatre = await OperatingTheatre.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Operating theatre not found'
      });
    }

    // Check theatre availability
    const existingSurgery = await Surgery.findOne({
      theatre: theatreId,
      date: new Date(date),
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    if (existingSurgery) {
      return res.status(409).json({
        success: false,
        message: 'Theatre is already booked for this time'
      });
    }

    const surgeryId = `SUR-${new Date().getFullYear()}-${String(await Surgery.countDocuments() + 1).padStart(4, '0')}`;

    const surgery = new Surgery({
      surgeryId,
      patient: patientId,
      surgeryType,
      surgeon: surgeonId,
      date: new Date(date),
      time,
      theatre: theatreId,
      priority: priority || 'Elective',
      team: teamId,
      estimatedDuration: estimatedDuration || 60,
      notes,
      preOpInstructions,
      status: 'Scheduled'
    });

    await surgery.save();

    // Update theatre availability
    theatre.currentSurgery = surgery._id;
    theatre.status = 'Occupied';
    await theatre.save();

    logger.info(`Surgery created: ${surgery.surgeryId}`);

    res.status(201).json({
      success: true,
      message: 'Surgery created successfully',
      data: surgery
    });
  } catch (error) {
    logger.error('Create surgery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create surgery',
      error: error.message
    });
  }
};

/**
 * Update surgery
 */
const updateSurgery = async (req, res) => {
  try {
    const surgery = await Surgery.findById(req.params.id);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const {
      status,
      date,
      time,
      priority,
      teamId,
      estimatedDuration,
      notes,
      actualDuration,
      outcome,
      complications,
      postOpInstructions
    } = req.body;

    if (status) surgery.status = status;
    if (date) surgery.date = new Date(date);
    if (time) surgery.time = time;
    if (priority) surgery.priority = priority;
    if (teamId) surgery.team = teamId;
    if (estimatedDuration) surgery.estimatedDuration = estimatedDuration;
    if (notes) surgery.notes = notes;
    if (actualDuration) surgery.actualDuration = actualDuration;
    if (outcome) surgery.outcome = outcome;
    if (complications) surgery.complications = complications;
    if (postOpInstructions) surgery.postOpInstructions = postOpInstructions;

    if (status === 'Completed') {
      surgery.completedAt = new Date();
    }

    await surgery.save();

    logger.info(`Surgery updated: ${surgery.surgeryId}`);

    res.status(200).json({
      success: true,
      message: 'Surgery updated successfully',
      data: surgery
    });
  } catch (error) {
    logger.error('Update surgery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update surgery',
      error: error.message
    });
  }
};

/**
 * Delete surgery
 */
const deleteSurgery = async (req, res) => {
  try {
    const surgery = await Surgery.findById(req.params.id);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    surgery.status = 'Cancelled';
    await surgery.save();

    // Release theatre
    const theatre = await OperatingTheatre.findById(surgery.theatre);
    if (theatre) {
      theatre.currentSurgery = null;
      theatre.status = 'Available';
      await theatre.save();
    }

    logger.info(`Surgery cancelled: ${surgery.surgeryId}`);

    res.status(200).json({
      success: true,
      message: 'Surgery cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete surgery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel surgery',
      error: error.message
    });
  }
};

/**
 * Get today's surgeries
 */
const getTodaySurgeries = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const surgeries = await Surgery.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Cancelled'] }
    })
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    logger.error('Get today surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today surgeries',
      error: error.message
    });
  }
};

/**
 * Get upcoming surgeries
 */
const getUpcomingSurgeries = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const surgeries = await Surgery.find({
      date: { $gte: today },
      status: { $in: ['Scheduled', 'Pre-Op'] }
    })
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .sort({ date: 1, time: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    logger.error('Get upcoming surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming surgeries',
      error: error.message
    });
  }
};

/**
 * Get completed surgeries
 */
const getCompletedSurgeries = async (req, res) => {
  try {
    const surgeries = await Surgery.find({
      status: 'Completed'
    })
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .sort({ completedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    logger.error('Get completed surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed surgeries',
      error: error.message
    });
  }
};

/**
 * Get surgeries by surgeon
 */
const getSurgeriesBySurgeon = async (req, res) => {
  try {
    const { surgeonId } = req.params;
    const { status, date } = req.query;

    let query = { surgeon: surgeonId };
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const surgeries = await Surgery.find(query)
      .populate('patient', 'patientId')
      .populate('theatre', 'name location')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    logger.error('Get surgeries by surgeon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgeries by surgeon',
      error: error.message
    });
  }
};

/**
 * Get surgeries by patient
 */
const getSurgeriesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const surgeries = await Surgery.find({ patient: patientId })
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    logger.error('Get surgeries by patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgeries by patient',
      error: error.message
    });
  }
};

/**
 * Get surgery types
 */
const getSurgeryTypes = async (req, res) => {
  try {
    const types = await SurgeryType.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Get surgery types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery types',
      error: error.message
    });
  }
};

/**
 * Get surgery type by ID
 */
const getSurgeryTypeById = async (req, res) => {
  try {
    const type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Surgery type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: type
    });
  } catch (error) {
    logger.error('Get surgery type by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery type',
      error: error.message
    });
  }
};

/**
 * Create surgery type
 */
const createSurgeryType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, category, estimatedDuration, description, requirements } = req.body;

    const type = new SurgeryType({
      name,
      category,
      estimatedDuration,
      description,
      requirements: requirements || [],
      isActive: true
    });

    await type.save();

    logger.info(`Surgery type created: ${type.name}`);

    res.status(201).json({
      success: true,
      message: 'Surgery type created successfully',
      data: type
    });
  } catch (error) {
    logger.error('Create surgery type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create surgery type',
      error: error.message
    });
  }
};

/**
 * Update surgery type
 */
const updateSurgeryType = async (req, res) => {
  try {
    const type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Surgery type not found'
      });
    }

    const { name, category, estimatedDuration, description, requirements, isActive } = req.body;

    if (name) type.name = name;
    if (category) type.category = category;
    if (estimatedDuration) type.estimatedDuration = estimatedDuration;
    if (description) type.description = description;
    if (requirements) type.requirements = requirements;
    if (isActive !== undefined) type.isActive = isActive;

    await type.save();

    logger.info(`Surgery type updated: ${type.name}`);

    res.status(200).json({
      success: true,
      message: 'Surgery type updated successfully',
      data: type
    });
  } catch (error) {
    logger.error('Update surgery type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update surgery type',
      error: error.message
    });
  }
};

/**
 * Delete surgery type
 */
const deleteSurgeryType = async (req, res) => {
  try {
    const type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Surgery type not found'
      });
    }

    type.isActive = false;
    await type.save();

    logger.info(`Surgery type deactivated: ${type.name}`);

    res.status(200).json({
      success: true,
      message: 'Surgery type deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete surgery type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate surgery type',
      error: error.message
    });
  }
};

/**
 * Get theatres
 */
const getTheatres = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const theatres = await OperatingTheatre.find(query)
      .populate('currentSurgery', 'surgeryId patient date time')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: theatres
    });
  } catch (error) {
    logger.error('Get theatres error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get theatres',
      error: error.message
    });
  }
};

/**
 * Get theatre by ID
 */
const getTheatreById = async (req, res) => {
  try {
    const theatre = await OperatingTheatre.findById(req.params.id)
      .populate('currentSurgery');

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    res.status(200).json({
      success: true,
      data: theatre
    });
  } catch (error) {
    logger.error('Get theatre by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get theatre',
      error: error.message
    });
  }
};

/**
 * Create theatre
 */
const createTheatre = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, location, capacity, equipment, operatingHours } = req.body;

    const theatreId = `THE-${new Date().getFullYear()}-${String(await OperatingTheatre.countDocuments() + 1).padStart(4, '0')}`;

    const theatre = new OperatingTheatre({
      theatreId,
      name,
      location,
      capacity: capacity || 1,
      equipment: equipment || [],
      operatingHours: operatingHours || {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '08:00', end: '13:00' },
        sunday: { start: null, end: null }
      },
      status: 'Available'
    });

    await theatre.save();

    logger.info(`Theatre created: ${theatre.theatreId}`);

    res.status(201).json({
      success: true,
      message: 'Theatre created successfully',
      data: theatre
    });
  } catch (error) {
    logger.error('Create theatre error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create theatre',
      error: error.message
    });
  }
};

/**
 * Update theatre
 */
const updateTheatre = async (req, res) => {
  try {
    const theatre = await OperatingTheatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    const { name, location, capacity, equipment, operatingHours, status } = req.body;

    if (name) theatre.name = name;
    if (location) theatre.location = location;
    if (capacity) theatre.capacity = capacity;
    if (equipment) theatre.equipment = equipment;
    if (operatingHours) theatre.operatingHours = operatingHours;
    if (status) theatre.status = status;

    await theatre.save();

    logger.info(`Theatre updated: ${theatre.theatreId}`);

    res.status(200).json({
      success: true,
      message: 'Theatre updated successfully',
      data: theatre
    });
  } catch (error) {
    logger.error('Update theatre error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theatre',
      error: error.message
    });
  }
};

/**
 * Delete theatre
 */
const deleteTheatre = async (req, res) => {
  try {
    const theatre = await OperatingTheatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    theatre.status = 'Out of Service';
    await theatre.save();

    logger.info(`Theatre deactivated: ${theatre.theatreId}`);

    res.status(200).json({
      success: true,
      message: 'Theatre deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete theatre error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate theatre',
      error: error.message
    });
  }
};

/**
 * Get theatre availability
 */
const getTheatreAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const theatres = await OperatingTheatre.find({ status: 'Available' });

    const availability = theatres.map(theatre => ({
      theatre: {
        id: theatre._id,
        name: theatre.name,
        location: theatre.location
      },
      isAvailable: true,
      date: targetDate
    }));

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Get theatre availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get theatre availability',
      error: error.message
    });
  }
};

/**
 * Book theatre
 */
const bookTheatre = async (req, res) => {
  try {
    const theatre = await OperatingTheatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    if (theatre.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Theatre is not available'
      });
    }

    const { surgeryId } = req.body;

    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    theatre.currentSurgery = surgeryId;
    theatre.status = 'Occupied';
    await theatre.save();

    surgery.theatre = theatre._id;
    await surgery.save();

    logger.info(`Theatre booked: ${theatre.theatreId} for surgery: ${surgery.surgeryId}`);

    res.status(200).json({
      success: true,
      message: 'Theatre booked successfully',
      data: theatre
    });
  } catch (error) {
    logger.error('Book theatre error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book theatre',
      error: error.message
    });
  }
};

/**
 * Release theatre
 */
const releaseTheatre = async (req, res) => {
  try {
    const theatre = await OperatingTheatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found'
      });
    }

    theatre.currentSurgery = null;
    theatre.status = 'Available';
    await theatre.save();

    logger.info(`Theatre released: ${theatre.theatreId}`);

    res.status(200).json({
      success: true,
      message: 'Theatre released successfully',
      data: theatre
    });
  } catch (error) {
    logger.error('Release theatre error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release theatre',
      error: error.message
    });
  }
};

/**
 * Get surgery teams
 */
const getSurgeryTeams = async (req, res) => {
  try {
    const teams = await SurgeryTeam.find()
      .populate('members', 'firstName lastName role');

    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    logger.error('Get surgery teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery teams',
      error: error.message
    });
  }
};

/**
 * Get surgery team by ID
 */
const getSurgeryTeamById = async (req, res) => {
  try {
    const team = await SurgeryTeam.findById(req.params.id)
      .populate('members', 'firstName lastName role');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Surgery team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error('Get surgery team by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery team',
      error: error.message
    });
  }
};

/**
 * Create surgery team
 */
const createSurgeryTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, members, specialization } = req.body;

    const team = new SurgeryTeam({
      name,
      members: members || [],
      specialization,
      isActive: true
    });

    await team.save();

    logger.info(`Surgery team created: ${team.name}`);

    res.status(201).json({
      success: true,
      message: 'Surgery team created successfully',
      data: team
    });
  } catch (error) {
    logger.error('Create surgery team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create surgery team',
      error: error.message
    });
  }
};

/**
 * Update surgery team
 */
const updateSurgeryTeam = async (req, res) => {
  try {
    const team = await SurgeryTeam.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Surgery team not found'
      });
    }

    const { name, members, specialization, isActive } = req.body;

    if (name) team.name = name;
    if (members) team.members = members;
    if (specialization) team.specialization = specialization;
    if (isActive !== undefined) team.isActive = isActive;

    await team.save();

    logger.info(`Surgery team updated: ${team.name}`);

    res.status(200).json({
      success: true,
      message: 'Surgery team updated successfully',
      data: team
    });
  } catch (error) {
    logger.error('Update surgery team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update surgery team',
      error: error.message
    });
  }
};

/**
 * Delete surgery team
 */
const deleteSurgeryTeam = async (req, res) => {
  try {
    const team = await SurgeryTeam.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Surgery team not found'
      });
    }

    team.isActive = false;
    await team.save();

    logger.info(`Surgery team deactivated: ${team.name}`);

    res.status(200).json({
      success: true,
      message: 'Surgery team deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete surgery team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate surgery team',
      error: error.message
    });
  }
};

/**
 * Assign team to surgery
 */
const assignTeamToSurgery = async (req, res) => {
  try {
    const { surgeryId, teamId } = req.body;

    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const team = await SurgeryTeam.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    surgery.team = teamId;
    await surgery.save();

    logger.info(`Team assigned to surgery: ${surgery.surgeryId}`);

    res.status(200).json({
      success: true,
      message: 'Team assigned successfully',
      data: surgery
    });
  } catch (error) {
    logger.error('Assign team to surgery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign team',
      error: error.message
    });
  }
};

/**
 * Get surgery notes
 */
const getSurgeryNotes = async (req, res) => {
  try {
    const { surgeryId } = req.query;
    let query = {};
    if (surgeryId) query.surgery = surgeryId;

    const notes = await SurgeryNote.find(query)
      .populate('author', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    logger.error('Get surgery notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery notes',
      error: error.message
    });
  }
};

/**
 * Get surgery note by ID
 */
const getSurgeryNoteById = async (req, res) => {
  try {
    const note = await SurgeryNote.findById(req.params.id)
      .populate('author', 'firstName lastName role');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Surgery note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    logger.error('Get surgery note by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery note',
      error: error.message
    });
  }
};

/**
 * Create surgery note
 */
const createSurgeryNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { surgeryId, content, type } = req.body;

    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const note = new SurgeryNote({
      surgery: surgeryId,
      author: req.user._id,
      content,
      type: type || 'Intra-Op',
      createdAt: new Date()
    });

    await note.save();

    logger.info(`Surgery note created for: ${surgery.surgeryId}`);

    res.status(201).json({
      success: true,
      message: 'Surgery note created successfully',
      data: note
    });
  } catch (error) {
    logger.error('Create surgery note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create surgery note',
      error: error.message
    });
  }
};

/**
 * Update surgery note
 */
const updateSurgeryNote = async (req, res) => {
  try {
    const note = await SurgeryNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Surgery note not found'
      });
    }

    const { content, type } = req.body;

    if (content) note.content = content;
    if (type) note.type = type;

    await note.save();

    logger.info(`Surgery note updated: ${note._id}`);

    res.status(200).json({
      success: true,
      message: 'Surgery note updated successfully',
      data: note
    });
  } catch (error) {
    logger.error('Update surgery note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update surgery note',
      error: error.message
    });
  }
};

/**
 * Delete surgery note
 */
const deleteSurgeryNote = async (req, res) => {
  try {
    const note = await SurgeryNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Surgery note not found'
      });
    }

    await note.remove();

    logger.info(`Surgery note deleted: ${note._id}`);

    res.status(200).json({
      success: true,
      message: 'Surgery note deleted successfully'
    });
  } catch (error) {
    logger.error('Delete surgery note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete surgery note',
      error: error.message
    });
  }
};

/**
 * Get pre-op assessment
 */
const getPreOpAssessment = async (req, res) => {
  try {
    const { surgeryId } = req.params;

    const assessment = await PreOpAssessment.findOne({ surgery: surgeryId })
      .populate('performedBy', 'firstName lastName');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Pre-op assessment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Get pre-op assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pre-op assessment',
      error: error.message
    });
  }
};

/**
 * Create pre-op assessment
 */
const createPreOpAssessment = async (req, res) => {
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
      surgeryId,
      findings,
      recommendations,
      vitals,
      allergies,
      medications,
      riskAssessment
    } = req.body;

    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const assessment = new PreOpAssessment({
      surgery: surgeryId,
      performedBy: req.user._id,
      findings,
      recommendations,
      vitals,
      allergies,
      medications,
      riskAssessment,
      assessedAt: new Date()
    });

    await assessment.save();

    // Update surgery status
    surgery.status = 'Pre-Op';
    await surgery.save();

    logger.info(`Pre-op assessment created for: ${surgery.surgeryId}`);

    res.status(201).json({
      success: true,
      message: 'Pre-op assessment created successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Create pre-op assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pre-op assessment',
      error: error.message
    });
  }
};

/**
 * Update pre-op assessment
 */
const updatePreOpAssessment = async (req, res) => {
  try {
    const assessment = await PreOpAssessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Pre-op assessment not found'
      });
    }

    const { findings, recommendations, vitals, allergies, medications, riskAssessment } = req.body;

    if (findings) assessment.findings = findings;
    if (recommendations) assessment.recommendations = recommendations;
    if (vitals) assessment.vitals = { ...assessment.vitals, ...vitals };
    if (allergies) assessment.allergies = allergies;
    if (medications) assessment.medications = medications;
    if (riskAssessment) assessment.riskAssessment = riskAssessment;

    await assessment.save();

    logger.info(`Pre-op assessment updated: ${assessment._id}`);

    res.status(200).json({
      success: true,
      message: 'Pre-op assessment updated successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Update pre-op assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pre-op assessment',
      error: error.message
    });
  }
};

/**
 * Get post-op care
 */
const getPostOpCare = async (req, res) => {
  try {
    const { surgeryId } = req.params;

    const care = await PostOpCare.findOne({ surgery: surgeryId })
      .populate('performedBy', 'firstName lastName');

    if (!care) {
      return res.status(404).json({
        success: false,
        message: 'Post-op care not found'
      });
    }

    res.status(200).json({
      success: true,
      data: care
    });
  } catch (error) {
    logger.error('Get post-op care error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get post-op care',
      error: error.message
    });
  }
};

/**
 * Create post-op care
 */
const createPostOpCare = async (req, res) => {
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
      surgeryId,
      observations,
      medications,
      instructions,
      vitals,
      complications
    } = req.body;

    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const care = new PostOpCare({
      surgery: surgeryId,
      performedBy: req.user._id,
      observations,
      medications,
      instructions,
      vitals,
      complications,
      assessedAt: new Date()
    });

    await care.save();

    // Update surgery status
    surgery.status = 'Recovery';
    await surgery.save();

    logger.info(`Post-op care created for: ${surgery.surgeryId}`);

    res.status(201).json({
      success: true,
      message: 'Post-op care created successfully',
      data: care
    });
  } catch (error) {
    logger.error('Create post-op care error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post-op care',
      error: error.message
    });
  }
};

/**
 * Update post-op care
 */
const updatePostOpCare = async (req, res) => {
  try {
    const care = await PostOpCare.findById(req.params.id);
    if (!care) {
      return res.status(404).json({
        success: false,
        message: 'Post-op care not found'
      });
    }

    const { observations, medications, instructions, vitals, complications } = req.body;

    if (observations) care.observations = observations;
    if (medications) care.medications = medications;
    if (instructions) care.instructions = instructions;
    if (vitals) care.vitals = { ...care.vitals, ...vitals };
    if (complications) care.complications = complications;

    await care.save();

    logger.info(`Post-op care updated: ${care._id}`);

    res.status(200).json({
      success: true,
      message: 'Post-op care updated successfully',
      data: care
    });
  } catch (error) {
    logger.error('Update post-op care error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post-op care',
      error: error.message
    });
  }
};

/**
 * Get surgery stats
 */
const getSurgeryStats = async (req, res) => {
  try {
    const [
      total,
      scheduled,
      inProgress,
      completed,
      cancelled
    ] = await Promise.all([
      Surgery.countDocuments(),
      Surgery.countDocuments({ status: 'Scheduled' }),
      Surgery.countDocuments({ status: 'In Progress' }),
      Surgery.countDocuments({ status: 'Completed' }),
      Surgery.countDocuments({ status: 'Cancelled' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        scheduled,
        inProgress,
        completed,
        cancelled
      }
    });
  } catch (error) {
    logger.error('Get surgery stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery stats',
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
      todaySurgeries,
      completedToday,
      cancelledToday
    ] = await Promise.all([
      Surgery.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Surgery.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      }),
      Surgery.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: 'Cancelled'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        todaySurgeries,
        completedToday,
        cancelledToday
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
      monthSurgeries,
      completedMonth
    ] = await Promise.all([
      Surgery.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth } }),
      Surgery.countDocuments({
        date: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Completed'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        monthSurgeries,
        completedMonth
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
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate surgery reports
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
 * Get surgery summary
 */
const getSurgerySummary = async (req, res) => {
  try {
    const surgery = await Surgery.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('surgeon', 'doctorId specialty')
      .populate('theatre', 'name location')
      .populate('preOpAssessment')
      .populate('postOpCare');

    if (!surgery) {
      return res.status(404).json({
        success: false,
        message: 'Surgery not found'
      });
    }

    const summary = {
      surgeryId: surgery.surgeryId,
      patient: surgery.patient,
      surgeon: surgery.surgeon,
      date: surgery.date,
      time: surgery.time,
      status: surgery.status,
      surgeryType: surgery.surgeryType,
      preOpAssessment: surgery.preOpAssessment,
      postOpCare: surgery.postOpCare,
      outcome: surgery.outcome,
      complications: surgery.complications
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get surgery summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery summary',
      error: error.message
    });
  }
};

module.exports = {
  getSurgeries,
  getSurgeryById,
  createSurgery,
  updateSurgery,
  deleteSurgery,
  getTodaySurgeries,
  getUpcomingSurgeries,
  getCompletedSurgeries,
  getSurgeriesBySurgeon,
  getSurgeriesByPatient,
  getSurgeryTypes,
  getSurgeryTypeById,
  createSurgeryType,
  updateSurgeryType,
  deleteSurgeryType,
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getTheatreAvailability,
  bookTheatre,
  releaseTheatre,
  getSurgeryTeams,
  getSurgeryTeamById,
  createSurgeryTeam,
  updateSurgeryTeam,
  deleteSurgeryTeam,
  assignTeamToSurgery,
  getSurgeryNotes,
  getSurgeryNoteById,
  createSurgeryNote,
  updateSurgeryNote,
  deleteSurgeryNote,
  getPreOpAssessment,
  createPreOpAssessment,
  updatePreOpAssessment,
  getPostOpCare,
  createPostOpCare,
  updatePostOpCare,
  getSurgeryStats,
  getDailyStats,
  getMonthlyStats,
  getReports,
  generateReport,
  getSurgerySummary
};
