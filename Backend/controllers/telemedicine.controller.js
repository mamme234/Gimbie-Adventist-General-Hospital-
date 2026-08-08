/**
 * ============================================
 * TELEMEDICINE.CONTROLLER.JS - Telemedicine Controller
 * ============================================
 */

const TelemedicineSession = require('../models/TelemedicineSession');
const VideoCall = require('../models/VideoCall');
const TelePrescription = require('../models/TelePrescription');
const TeleNote = require('../models/TeleNote');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

/**
 * Get all telemedicine sessions
 */
const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (type) query.type = type;

    const sessions = await TelemedicineSession.find(query)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1, time: -1 });

    const total = await TelemedicineSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get telemedicine sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get telemedicine sessions',
      error: error.message
    });
  }
};

/**
 * Get session by ID
 */
const getSessionById = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Get session by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message
    });
  }
};

/**
 * Create session
 */
const createSession = async (req, res) => {
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
      doctorId,
      date,
      time,
      type,
      reason,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicts
    const existingSession = await TelemedicineSession.findOne({
      doctor: doctorId,
      date: new Date(date),
      time,
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    const sessionId = `TEL-${new Date().getFullYear()}-${String(await TelemedicineSession.countDocuments() + 1).padStart(4, '0')}`;

    const session = new TelemedicineSession({
      sessionId,
      patient: patientId,
      doctor: doctorId,
      date: new Date(date),
      time,
      type: type || 'Video',
      reason,
      notes,
      status: 'Scheduled'
    });

    await session.save();

    // Create video call if type is video
    if (type === 'Video') {
      const videoCall = new VideoCall({
        session: session._id,
        provider: 'Jitsi',
        roomName: sessionId,
        status: 'Waiting'
      });
      await videoCall.save();
      session.videoCall = videoCall._id;
      await session.save();
    }

    // Send notification
    sendNotification(`user:${patient.userId}`, {
      type: 'TELEMEDICINE_SCHEDULED',
      sessionId: session.sessionId,
      date: session.date,
      time: session.time,
      doctor: `${doctor.user.firstName} ${doctor.user.lastName}`
    });

    logger.info(`Telemedicine session created: ${session.sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Telemedicine session created successfully',
      data: session
    });
  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

/**
 * Update session
 */
const updateSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const { date, time, status, notes } = req.body;

    if (date) session.date = new Date(date);
    if (time) session.time = time;
    if (status) session.status = status;
    if (notes) session.notes = notes;

    await session.save();

    logger.info(`Telemedicine session updated: ${session.sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });
  } catch (error) {
    logger.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

/**
 * Delete session
 */
const deleteSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status = 'Cancelled';
    await session.save();

    logger.info(`Telemedicine session cancelled: ${session.sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel session',
      error: error.message
    });
  }
};

/**
 * Get patient sessions
 */
const getPatientSessions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const sessions = await TelemedicineSession.find({ patient: patientId })
      .populate('doctor', 'doctorId specialty')
      .sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Get patient sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient sessions',
      error: error.message
    });
  }
};

/**
 * Get doctor sessions
 */
const getDoctorSessions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const sessions = await TelemedicineSession.find({ doctor: doctorId })
      .populate('patient', 'patientId')
      .sort({ date: -1, time: -1 });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Get doctor sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor sessions',
      error: error.message
    });
  }
};

/**
 * Get active sessions
 */
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await TelemedicineSession.find({
      status: 'In Progress'
    })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active sessions',
      error: error.message
    });
  }
};

/**
 * Get completed sessions
 */
const getCompletedSessions = async (req, res) => {
  try {
    const sessions = await TelemedicineSession.find({
      status: 'Completed'
    })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ completedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Get completed sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed sessions',
      error: error.message
    });
  }
};

/**
 * Get upcoming sessions
 */
const getUpcomingSessions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await TelemedicineSession.find({
      date: { $gte: today },
      status: { $in: ['Scheduled', 'Confirmed'] }
    })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ date: 1, time: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    logger.error('Get upcoming sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming sessions',
      error: error.message
    });
  }
};

/**
 * Start session
 */
const startSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'Scheduled' && session.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be started'
      });
    }

    session.status = 'In Progress';
    session.startedAt = new Date();
    await session.save();

    // Update video call status
    if (session.videoCall) {
      const videoCall = await VideoCall.findById(session.videoCall);
      if (videoCall) {
        videoCall.status = 'In Progress';
        videoCall.startedAt = new Date();
        await videoCall.save();
      }
    }

    // Send notification
    sendNotification(`user:${session.patient.userId}`, {
      type: 'TELEMEDICINE_STARTED',
      sessionId: session.sessionId
    });

    logger.info(`Telemedicine session started: ${session.sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session started successfully',
      data: session
    });
  } catch (error) {
    logger.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: error.message
    });
  }
};

/**
 * End session
 */
const endSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status = 'Completed';
    session.completedAt = new Date();
    await session.save();

    // Update video call status
    if (session.videoCall) {
      const videoCall = await VideoCall.findById(session.videoCall);
      if (videoCall) {
        videoCall.status = 'Ended';
        videoCall.endedAt = new Date();
        await videoCall.save();
      }
    }

    logger.info(`Telemedicine session ended: ${session.sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: error.message
    });
  }
};

/**
 * Join session
 */
const joinSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if video call exists
    if (!session.videoCall) {
      return res.status(400).json({
        success: false,
        message: 'No video call associated with this session'
      });
    }

    const videoCall = await VideoCall.findById(session.videoCall);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    // Generate join link
    const joinLink = videoCall.link || `${process.env.JITSI_URL}/${session.sessionId}`;

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        joinLink,
        roomName: videoCall.roomName,
        status: videoCall.status
      }
    });
  } catch (error) {
    logger.error('Join session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join session',
      error: error.message
    });
  }
};

/**
 * Leave session
 */
const leaveSession = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update video call participants
    if (session.videoCall) {
      const videoCall = await VideoCall.findById(session.videoCall);
      if (videoCall) {
        // Remove participant logic
        await videoCall.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Left session successfully'
    });
  } catch (error) {
    logger.error('Leave session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave session',
      error: error.message
    });
  }
};

/**
 * Get session status
 */
const getSessionStatus = async (req, res) => {
  try {
    const session = await TelemedicineSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        date: session.date,
        time: session.time,
        type: session.type
      }
    });
  } catch (error) {
    logger.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: error.message
    });
  }
};

/**
 * Get video calls
 */
const getVideoCalls = async (req, res) => {
  try {
    const { status, sessionId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (sessionId) query.session = sessionId;

    const videoCalls = await VideoCall.find(query)
      .populate('session', 'sessionId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videoCalls
    });
  } catch (error) {
    logger.error('Get video calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video calls',
      error: error.message
    });
  }
};

/**
 * Get video call by ID
 */
const getVideoCallById = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id)
      .populate('session', 'sessionId');

    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    res.status(200).json({
      success: true,
      data: videoCall
    });
  } catch (error) {
    logger.error('Get video call by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video call',
      error: error.message
    });
  }
};

/**
 * Create video call
 */
const createVideoCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { sessionId, provider, link, settings } = req.body;

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const videoCall = new VideoCall({
      session: sessionId,
      provider: provider || 'Jitsi',
      link: link || `${process.env.JITSI_URL}/${session.sessionId}`,
      roomName: session.sessionId,
      settings: settings || {},
      status: 'Waiting'
    });

    await videoCall.save();

    // Update session
    session.videoCall = videoCall._id;
    await session.save();

    logger.info(`Video call created for session: ${session.sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Video call created successfully',
      data: videoCall
    });
  } catch (error) {
    logger.error('Create video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video call',
      error: error.message
    });
  }
};

/**
 * Update video call
 */
const updateVideoCall = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    const { status, link, settings } = req.body;

    if (status) videoCall.status = status;
    if (link) videoCall.link = link;
    if (settings) videoCall.settings = settings;

    await videoCall.save();

    logger.info(`Video call updated: ${videoCall._id}`);

    res.status(200).json({
      success: true,
      message: 'Video call updated successfully',
      data: videoCall
    });
  } catch (error) {
    logger.error('Update video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video call',
      error: error.message
    });
  }
};

/**
 * Delete video call
 */
const deleteVideoCall = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    await videoCall.remove();

    // Remove reference from session
    const session = await TelemedicineSession.findById(videoCall.session);
    if (session) {
      session.videoCall = null;
      await session.save();
    }

    logger.info(`Video call deleted: ${videoCall._id}`);

    res.status(200).json({
      success: true,
      message: 'Video call deleted successfully'
    });
  } catch (error) {
    logger.error('Delete video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video call',
      error: error.message
    });
  }
};

/**
 * Start video call
 */
const startVideoCall = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    videoCall.status = 'In Progress';
    videoCall.startedAt = new Date();
    await videoCall.save();

    // Update session status
    const session = await TelemedicineSession.findById(videoCall.session);
    if (session) {
      session.status = 'In Progress';
      session.startedAt = new Date();
      await session.save();
    }

    logger.info(`Video call started: ${videoCall._id}`);

    res.status(200).json({
      success: true,
      message: 'Video call started successfully',
      data: videoCall
    });
  } catch (error) {
    logger.error('Start video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start video call',
      error: error.message
    });
  }
};

/**
 * End video call
 */
const endVideoCall = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    videoCall.status = 'Ended';
    videoCall.endedAt = new Date();
    await videoCall.save();

    // Update session status
    const session = await TelemedicineSession.findById(videoCall.session);
    if (session) {
      session.status = 'Completed';
      session.completedAt = new Date();
      await session.save();
    }

    logger.info(`Video call ended: ${videoCall._id}`);

    res.status(200).json({
      success: true,
      message: 'Video call ended successfully',
      data: videoCall
    });
  } catch (error) {
    logger.error('End video call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end video call',
      error: error.message
    });
  }
};

/**
 * Get video call token
 */
const getVideoCallToken = async (req, res) => {
  try {
    const videoCall = await VideoCall.findById(req.params.id);
    if (!videoCall) {
      return res.status(404).json({
        success: false,
        message: 'Video call not found'
      });
    }

    // Generate JWT token for video call
    // Placeholder - would use actual token generation
    const token = `jwt-token-${videoCall._id}`;

    res.status(200).json({
      success: true,
      data: {
        token,
        roomName: videoCall.roomName,
        link: videoCall.link
      }
    });
  } catch (error) {
    logger.error('Get video call token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video call token',
      error: error.message
    });
  }
};

/**
 * Get tele-prescriptions
 */
const getTelePrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId, sessionId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (patientId) query.patient = patientId;
    if (sessionId) query.session = sessionId;

    const prescriptions = await TelePrescription.find(query)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('session', 'sessionId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TelePrescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get tele-prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tele-prescriptions',
      error: error.message
    });
  }
};

/**
 * Get tele-prescription by ID
 */
const getTelePrescriptionById = async (req, res) => {
  try {
    const prescription = await TelePrescription.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('session', 'sessionId');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error('Get tele-prescription by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tele-prescription',
      error: error.message
    });
  }
};

/**
 * Create tele-prescription
 */
const createTelePrescription = async (req, res) => {
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
      sessionId,
      medications,
      diagnosis,
      notes
    } = req.body;

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const prescriptionId = `TPR-${new Date().getFullYear()}-${String(await TelePrescription.countDocuments() + 1).padStart(4, '0')}`;

    const prescription = new TelePrescription({
      prescriptionId,
      session: sessionId,
      patient: session.patient,
      doctor: session.doctor,
      medications,
      diagnosis,
      notes,
      status: 'Active'
    });

    await prescription.save();

    logger.info(`Tele-prescription created: ${prescription.prescriptionId}`);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Create tele-prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tele-prescription',
      error: error.message
    });
  }
};

/**
 * Update tele-prescription
 */
const updateTelePrescription = async (req, res) => {
  try {
    const prescription = await TelePrescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const { medications, diagnosis, status, notes } = req.body;

    if (medications) prescription.medications = medications;
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (status) prescription.status = status;
    if (notes) prescription.notes = notes;

    await prescription.save();

    logger.info(`Tele-prescription updated: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Update tele-prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tele-prescription',
      error: error.message
    });
  }
};

/**
 * Delete tele-prescription
 */
const deleteTelePrescription = async (req, res) => {
  try {
    const prescription = await TelePrescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    prescription.status = 'Discontinued';
    await prescription.save();

    logger.info(`Tele-prescription discontinued: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription discontinued successfully'
    });
  } catch (error) {
    logger.error('Delete tele-prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discontinue tele-prescription',
      error: error.message
    });
  }
};

/**
 * Get tele-notes
 */
const getTeleNotes = async (req, res) => {
  try {
    const { sessionId } = req.query;
    let query = {};
    if (sessionId) query.session = sessionId;

    const notes = await TeleNote.find(query)
      .populate('session', 'sessionId')
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    logger.error('Get tele-notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tele-notes',
      error: error.message
    });
  }
};

/**
 * Get tele-note by ID
 */
const getTeleNoteById = async (req, res) => {
  try {
    const note = await TeleNote.findById(req.params.id)
      .populate('session', 'sessionId')
      .populate('author', 'firstName lastName');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    logger.error('Get tele-note by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tele-note',
      error: error.message
    });
  }
};

/**
 * Create tele-note
 */
const createTeleNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { sessionId, content, type } = req.body;

    const session = await TelemedicineSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const note = new TeleNote({
      session: sessionId,
      author: req.user._id,
      content,
      type: type || 'Clinical'
    });

    await note.save();

    logger.info(`Tele-note created for session: ${session.sessionId}`);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    logger.error('Create tele-note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tele-note',
      error: error.message
    });
  }
};

/**
 * Update tele-note
 */
const updateTeleNote = async (req, res) => {
  try {
    const note = await TeleNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const { content, type } = req.body;

    if (content) note.content = content;
    if (type) note.type = type;

    await note.save();

    logger.info(`Tele-note updated: ${note._id}`);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    logger.error('Update tele-note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tele-note',
      error: error.message
    });
  }
};

/**
 * Delete tele-note
 */
const deleteTeleNote = async (req, res) => {
  try {
    const note = await TeleNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await note.remove();

    logger.info(`Tele-note deleted: ${note._id}`);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    logger.error('Delete tele-note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tele-note',
      error: error.message
    });
  }
};

/**
 * Get telemedicine stats
 */
const getTelemedicineStats = async (req, res) => {
  try {
    const [
      totalSessions,
      completedSessions,
      cancelledSessions,
      scheduledSessions,
      totalVideoCalls
    ] = await Promise.all([
      TelemedicineSession.countDocuments(),
      TelemedicineSession.countDocuments({ status: 'Completed' }),
      TelemedicineSession.countDocuments({ status: 'Cancelled' }),
      TelemedicineSession.countDocuments({ status: 'Scheduled' }),
      VideoCall.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        scheduledSessions,
        totalVideoCalls,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get telemedicine stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get telemedicine stats',
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
      sessionsToday,
      completedToday
    ] = await Promise.all([
      TelemedicineSession.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      TelemedicineSession.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        sessionsToday,
        completedToday
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
      sessionsMonth,
      completedMonth
    ] = await Promise.all([
      TelemedicineSession.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      TelemedicineSession.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Completed'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        sessionsMonth,
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
    // Placeholder - would generate telemedicine reports
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

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getPatientSessions,
  getDoctorSessions,
  getActiveSessions,
  getCompletedSessions,
  getUpcomingSessions,
  startSession,
  endSession,
  joinSession,
  leaveSession,
  getSessionStatus,
  getVideoCalls,
  getVideoCallById,
  createVideoCall,
  updateVideoCall,
  deleteVideoCall,
  startVideoCall,
  endVideoCall,
  getVideoCallToken,
  getTelePrescriptions,
  getTelePrescriptionById,
  createTelePrescription,
  updateTelePrescription,
  deleteTelePrescription,
  getTeleNotes,
  getTeleNoteById,
  createTeleNote,
  updateTeleNote,
  deleteTeleNote,
  getTelemedicineStats,
  getDailyStats,
  getMonthlyStats,
  getReports,
  generateReport
};
