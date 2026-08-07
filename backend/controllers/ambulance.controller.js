/**
 * ============================================
 * AMBULANCE.CONTROLLER.JS - Ambulance Controller
 * ============================================
 */

const Ambulance = require('../models/Ambulance');
const AmbulanceDispatch = require('../models/AmbulanceDispatch');
const EmergencyCall = require('../models/EmergencyCall');
const AmbulanceStaff = require('../models/AmbulanceStaff');
const AmbulanceMaintenance = require('../models/AmbulanceMaintenance');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

/**
 * Get all ambulances
 */
const getAmbulances = async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

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
      type: type || 'Basic',
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
 * Get maintenance ambulances
 */
const getMaintenanceAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find({
      status: 'Maintenance'
    }).populate('driver', 'firstName lastName phone');

    res.status(200).json({
      success: true,
      data: ambulances
    });
  } catch (error) {
    logger.error('Get maintenance ambulances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance ambulances',
      error: error.message
    });
  }
};

/**
 * Get dispatches
 */
const getDispatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, ambulanceId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (ambulanceId) query.ambulance = ambulanceId;

    const dispatches = await AmbulanceDispatch.find(query)
      .populate('ambulance', 'ambulanceId vehicleNumber type')
      .populate('emergencyCall', 'callerName location')
      .populate('assignedStaff', 'name role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dispatchedAt: -1 });

    const total = await AmbulanceDispatch.countDocuments(query);

    res.status(200).json({
      success: true,
      data: dispatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get dispatches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispatches',
      error: error.message
    });
  }
};

/**
 * Get dispatch by ID
 */
const getDispatchById = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id)
      .populate('ambulance', 'ambulanceId vehicleNumber type')
      .populate('emergencyCall', 'callerName location nature priority')
      .populate('assignedStaff', 'name role');

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dispatch
    });
  } catch (error) {
    logger.error('Get dispatch by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispatch',
      error: error.message
    });
  }
};

/**
 * Create dispatch
 */
const createDispatch = async (req, res) => {
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
      ambulanceId,
      emergencyCallId,
      location,
      priority,
      notes
    } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    if (ambulance.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Ambulance is not available'
      });
    }

    const emergencyCall = await EmergencyCall.findById(emergencyCallId);
    if (!emergencyCall) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    const dispatchId = `DSP-${new Date().getFullYear()}-${String(await AmbulanceDispatch.countDocuments() + 1).padStart(4, '0')}`;

    const dispatch = new AmbulanceDispatch({
      dispatchId,
      ambulance: ambulanceId,
      emergencyCall: emergencyCallId,
      location,
      priority: priority || 'Normal',
      notes,
      status: 'Dispatched',
      dispatchedAt: new Date()
    });

    await dispatch.save();

    // Update ambulance status
    ambulance.status = 'On Dispatch';
    ambulance.currentDispatch = dispatch._id;
    await ambulance.save();

    // Update emergency call status
    emergencyCall.status = 'Dispatched';
    await emergencyCall.save();

    // Send notification
    sendNotification('emergency-team', {
      type: 'AMBULANCE_DISPATCHED',
      dispatchId: dispatch.dispatchId,
      ambulanceId: ambulance.ambulanceId,
      location,
      priority
    });

    logger.info(`Ambulance dispatched: ${dispatch.dispatchId}`);

    res.status(201).json({
      success: true,
      message: 'Ambulance dispatched successfully',
      data: dispatch
    });
  } catch (error) {
    logger.error('Create dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dispatch',
      error: error.message
    });
  }
};

/**
 * Update dispatch
 */
const updateDispatch = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    const { status, notes, eta } = req.body;

    if (status) dispatch.status = status;
    if (notes) dispatch.notes = notes;
    if (eta) dispatch.eta = eta;

    if (status === 'Arrived') {
      dispatch.arrivedAt = new Date();
    } else if (status === 'Completed') {
      dispatch.completedAt = new Date();
    }

    await dispatch.save();

    // Update ambulance status if completed
    if (status === 'Completed') {
      const ambulance = await Ambulance.findById(dispatch.ambulance);
      if (ambulance) {
        ambulance.status = 'Available';
        ambulance.currentDispatch = null;
        await ambulance.save();
      }
    }

    logger.info(`Dispatch updated: ${dispatch.dispatchId}`);

    res.status(200).json({
      success: true,
      message: 'Dispatch updated successfully',
      data: dispatch
    });
  } catch (error) {
    logger.error('Update dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispatch',
      error: error.message
    });
  }
};

/**
 * Delete dispatch
 */
const deleteDispatch = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Reset ambulance status
    const ambulance = await Ambulance.findById(dispatch.ambulance);
    if (ambulance) {
      ambulance.status = 'Available';
      ambulance.currentDispatch = null;
      await ambulance.save();
    }

    await dispatch.remove();

    logger.info(`Dispatch deleted: ${dispatch.dispatchId}`);

    res.status(200).json({
      success: true,
      message: 'Dispatch deleted successfully'
    });
  } catch (error) {
    logger.error('Delete dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dispatch',
      error: error.message
    });
  }
};

/**
 * Get active dispatches
 */
const getActiveDispatches = async (req, res) => {
  try {
    const dispatches = await AmbulanceDispatch.find({
      status: { $in: ['Dispatched', 'En Route', 'Arrived', 'On Scene'] }
    })
      .populate('ambulance', 'ambulanceId vehicleNumber type')
      .populate('emergencyCall', 'callerName location')
      .sort({ dispatchedAt: 1 });

    res.status(200).json({
      success: true,
      data: dispatches
    });
  } catch (error) {
    logger.error('Get active dispatches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active dispatches',
      error: error.message
    });
  }
};

/**
 * Get completed dispatches
 */
const getCompletedDispatches = async (req, res) => {
  try {
    const dispatches = await AmbulanceDispatch.find({
      status: 'Completed'
    })
      .populate('ambulance', 'ambulanceId vehicleNumber type')
      .populate('emergencyCall', 'callerName location')
      .sort({ completedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: dispatches
    });
  } catch (error) {
    logger.error('Get completed dispatches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed dispatches',
      error: error.message
    });
  }
};

/**
 * Assign ambulance to dispatch
 */
const assignAmbulance = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    const { ambulanceId } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    if (ambulance.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Ambulance is not available'
      });
    }

    // Update previous ambulance if any
    if (dispatch.ambulance) {
      const previousAmbulance = await Ambulance.findById(dispatch.ambulance);
      if (previousAmbulance) {
        previousAmbulance.status = 'Available';
        previousAmbulance.currentDispatch = null;
        await previousAmbulance.save();
      }
    }

    dispatch.ambulance = ambulanceId;
    dispatch.status = 'Dispatched';
    dispatch.dispatchedAt = new Date();
    await dispatch.save();

    ambulance.status = 'On Dispatch';
    ambulance.currentDispatch = dispatch._id;
    await ambulance.save();

    logger.info(`Ambulance assigned to dispatch: ${dispatch.dispatchId}`);

    res.status(200).json({
      success: true,
      message: 'Ambulance assigned successfully',
      data: dispatch
    });
  } catch (error) {
    logger.error('Assign ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ambulance',
      error: error.message
    });
  }
};

/**
 * Update dispatch status
 */
const updateDispatchStatus = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    const { status, location, notes } = req.body;

    if (status) {
      dispatch.status = status;
      if (status === 'Arrived') dispatch.arrivedAt = new Date();
      if (status === 'Completed') dispatch.completedAt = new Date();
    }
    if (location) dispatch.location = location;
    if (notes) dispatch.notes = notes;

    await dispatch.save();

    // Update ambulance status if completed
    if (status === 'Completed') {
      const ambulance = await Ambulance.findById(dispatch.ambulance);
      if (ambulance) {
        ambulance.status = 'Available';
        ambulance.currentDispatch = null;
        await ambulance.save();
      }
    }

    // Update emergency call status
    if (dispatch.emergencyCall && status === 'Arrived') {
      const call = await EmergencyCall.findById(dispatch.emergencyCall);
      if (call) {
        call.status = 'Arrived';
        await call.save();
      }
    }

    logger.info(`Dispatch status updated: ${dispatch.dispatchId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Dispatch status updated successfully',
      data: dispatch
    });
  } catch (error) {
    logger.error('Update dispatch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dispatch status',
      error: error.message
    });
  }
};

/**
 * Complete dispatch
 */
const completeDispatch = async (req, res) => {
  try {
    const dispatch = await AmbulanceDispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    const { notes } = req.body;

    dispatch.status = 'Completed';
    dispatch.completedAt = new Date();
    if (notes) dispatch.notes = notes;
    await dispatch.save();

    // Reset ambulance
    const ambulance = await Ambulance.findById(dispatch.ambulance);
    if (ambulance) {
      ambulance.status = 'Available';
      ambulance.currentDispatch = null;
      await ambulance.save();
    }

    // Update emergency call
    if (dispatch.emergencyCall) {
      const call = await EmergencyCall.findById(dispatch.emergencyCall);
      if (call) {
        call.status = 'Completed';
        await call.save();
      }
    }

    logger.info(`Dispatch completed: ${dispatch.dispatchId}`);

    res.status(200).json({
      success: true,
      message: 'Dispatch completed successfully',
      data: dispatch
    });
  } catch (error) {
    logger.error('Complete dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete dispatch',
      error: error.message
    });
  }
};

/**
 * Get ambulance location
 */
const getAmbulanceLocation = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ambulanceId: ambulance.ambulanceId,
        location: ambulance.location,
        status: ambulance.status,
        lastUpdated: ambulance.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get ambulance location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance location',
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
    if (speed !== undefined) ambulance.speed = speed;
    if (heading !== undefined) ambulance.heading = heading;
    await ambulance.save();

    // Broadcast location update
    sendNotification('ambulance-tracking', {
      ambulanceId: ambulance.ambulanceId,
      location: { lat, lng },
      speed,
      heading,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Ambulance location updated',
      data: ambulance.location
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
 * Get ambulance history
 */
const getAmbulanceHistory = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    const dispatches = await AmbulanceDispatch.find({ ambulance: ambulance._id })
      .populate('emergencyCall', 'callerName location nature')
      .sort({ dispatchedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        ambulance: {
          ambulanceId: ambulance.ambulanceId,
          vehicleNumber: ambulance.vehicleNumber,
          type: ambulance.type
        },
        totalDispatches: dispatches.length,
        dispatches
      }
    });
  } catch (error) {
    logger.error('Get ambulance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance history',
      error: error.message
    });
  }
};

/**
 * Get emergency calls
 */
const getEmergencyCalls = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const calls = await EmergencyCall.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await EmergencyCall.countDocuments(query);

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get emergency calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency calls',
      error: error.message
    });
  }
};

/**
 * Get emergency call by ID
 */
const getEmergencyCallById = async (req, res) => {
  try {
    const call = await EmergencyCall.findById(req.params.id);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    res.status(200).json({
      success: true,
      data: call
    });
  } catch (error) {
    logger.error('Get emergency call by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emergency call',
      error: error.message
    });
  }
};

/**
 * Create emergency call
 */
const createEmergencyCall = async (req, res) => {
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
      callerName,
      callerPhone,
      location,
      nature,
      priority,
      notes
    } = req.body;

    const callId = `CAL-${new Date().getFullYear()}-${String(await EmergencyCall.countDocuments() + 1).padStart(4, '0')}`;

    const call = new EmergencyCall({
      callId,
      callerName,
      callerPhone,
      location,
      nature,
      priority: priority || 'Normal',
      notes,
      status: 'Received',
      receivedAt: new Date()
    });

    await call.save();

    // Send notification for high priority calls
    if (priority === 'Emergency' || priority === 'Urgent') {
      sendNotification('emergency-team', {
        type: 'EMERGENCY_CALL',
        callId: call.callId,
        priority,
        location,
        nature
      });
    }

    logger.info(`Emergency call created: ${call.callId}`);

    res.status(201).json({
      success: true,
      message: 'Emergency call created successfully',
      data: call
    });
  } catch (error) {
    logger.error('Create emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency call',
      error: error.message
    });
  }
};

/**
 * Update emergency call
 */
const updateEmergencyCall = async (req, res) => {
  try {
    const call = await EmergencyCall.findById(req.params.id);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    const { status, priority, notes, location } = req.body;

    if (status) call.status = status;
    if (priority) call.priority = priority;
    if (notes) call.notes = notes;
    if (location) call.location = location;

    await call.save();

    logger.info(`Emergency call updated: ${call.callId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency call updated successfully',
      data: call
    });
  } catch (error) {
    logger.error('Update emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency call',
      error: error.message
    });
  }
};

/**
 * Delete emergency call
 */
const deleteEmergencyCall = async (req, res) => {
  try {
    const call = await EmergencyCall.findById(req.params.id);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Emergency call not found'
      });
    }

    await call.remove();

    logger.info(`Emergency call deleted: ${call.callId}`);

    res.status(200).json({
      success: true,
      message: 'Emergency call deleted successfully'
    });
  } catch (error) {
    logger.error('Delete emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency call',
      error: error.message
    });
  }
};

/**
 * Get active calls
 */
const getActiveCalls = async (req, res) => {
  try {
    const calls = await EmergencyCall.find({
      status: { $nin: ['Completed', 'Cancelled'] }
    }).sort({ priority: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: calls
    });
  } catch (error) {
    logger.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active calls',
      error: error.message
    });
  }
};

/**
 * Get completed calls
 */
const getCompletedCalls = async (req, res) => {
  try {
    const calls = await EmergencyCall.find({
      status: 'Completed'
    }).sort({ completedAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      data: calls
    });
  } catch (error) {
    logger.error('Get completed calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed calls',
      error: error.message
    });
  }
};

/**
 * Get ambulance staff
 */
const getAmbulanceStaff = async (req, res) => {
  try {
    const staff = await AmbulanceStaff.find()
      .populate('user', 'firstName lastName phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    logger.error('Get ambulance staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance staff',
      error: error.message
    });
  }
};

/**
 * Get ambulance staff by ID
 */
const getAmbulanceStaffById = async (req, res) => {
  try {
    const staff = await AmbulanceStaff.findById(req.params.id)
      .populate('user', 'firstName lastName phone');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    logger.error('Get ambulance staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff',
      error: error.message
    });
  }
};

/**
 * Create ambulance staff
 */
const createAmbulanceStaff = async (req, res) => {
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
      userId,
      name,
      role,
      phone,
      licenseNumber,
      certifications,
      availability
    } = req.body;

    const staff = new AmbulanceStaff({
      user: userId,
      name,
      role: role || 'Driver',
      phone,
      licenseNumber,
      certifications: certifications || [],
      availability: availability || {},
      status: 'Active'
    });

    await staff.save();

    logger.info(`Ambulance staff created: ${staff.name}`);

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff
    });
  } catch (error) {
    logger.error('Create ambulance staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff',
      error: error.message
    });
  }
};

/**
 * Update ambulance staff
 */
const updateAmbulanceStaff = async (req, res) => {
  try {
    const staff = await AmbulanceStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    const {
      name,
      role,
      phone,
      licenseNumber,
      certifications,
      availability,
      status
    } = req.body;

    if (name) staff.name = name;
    if (role) staff.role = role;
    if (phone) staff.phone = phone;
    if (licenseNumber) staff.licenseNumber = licenseNumber;
    if (certifications) staff.certifications = certifications;
    if (availability) staff.availability = availability;
    if (status) staff.status = status;

    await staff.save();

    logger.info(`Ambulance staff updated: ${staff.name}`);

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });
  } catch (error) {
    logger.error('Update ambulance staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
      error: error.message
    });
  }
};

/**
 * Delete ambulance staff
 */
const deleteAmbulanceStaff = async (req, res) => {
  try {
    const staff = await AmbulanceStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    staff.status = 'Inactive';
    await staff.save();

    logger.info(`Ambulance staff deactivated: ${staff.name}`);

    res.status(200).json({
      success: true,
      message: 'Staff deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete ambulance staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate staff',
      error: error.message
    });
  }
};

/**
 * Get staff by ambulance
 */
const getStaffByAmbulance = async (req, res) => {
  try {
    const { ambulanceId } = req.params;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    const staff = await AmbulanceStaff.find({
      status: 'Active',
      assignedAmbulance: ambulanceId
    });

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    logger.error('Get staff by ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff by ambulance',
      error: error.message
    });
  }
};

/**
 * Get maintenance records
 */
const getMaintenanceRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, ambulanceId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (ambulanceId) query.ambulance = ambulanceId;

    const records = await AmbulanceMaintenance.find(query)
      .populate('ambulance', 'ambulanceId vehicleNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await AmbulanceMaintenance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get maintenance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance records',
      error: error.message
    });
  }
};

/**
 * Get maintenance record by ID
 */
const getMaintenanceRecordById = async (req, res) => {
  try {
    const record = await AmbulanceMaintenance.findById(req.params.id)
      .populate('ambulance', 'ambulanceId vehicleNumber');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    logger.error('Get maintenance record by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance record',
      error: error.message
    });
  }
};

/**
 * Create maintenance record
 */
const createMaintenanceRecord = async (req, res) => {
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
      ambulanceId,
      type,
      date,
      description,
      cost,
      performedBy,
      notes
    } = req.body;

    const ambulance = await Ambulance.findById(ambulanceId);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: 'Ambulance not found'
      });
    }

    const record = new AmbulanceMaintenance({
      ambulance: ambulanceId,
      type,
      date: new Date(date),
      description,
      cost: cost || 0,
      performedBy,
      notes,
      status: 'Scheduled'
    });

    await record.save();

    // Update ambulance status if maintenance is urgent
    if (type === 'Emergency' || type === 'Repair') {
      ambulance.status = 'Maintenance';
      await ambulance.save();
    }

    logger.info(`Maintenance record created for ambulance: ${ambulance.ambulanceId}`);

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: record
    });
  } catch (error) {
    logger.error('Create maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance record',
      error: error.message
    });
  }
};

/**
 * Update maintenance record
 */
const updateMaintenanceRecord = async (req, res) => {
  try {
    const record = await AmbulanceMaintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    const {
      type,
      date,
      description,
      cost,
      performedBy,
      status,
      notes
    } = req.body;

    if (type) record.type = type;
    if (date) record.date = new Date(date);
    if (description) record.description = description;
    if (cost) record.cost = cost;
    if (performedBy) record.performedBy = performedBy;
    if (status) record.status = status;
    if (notes) record.notes = notes;

    if (status === 'Completed') {
      record.completedAt = new Date();
      // Update ambulance status back to available
      const ambulance = await Ambulance.findById(record.ambulance);
      if (ambulance) {
        ambulance.status = 'Available';
        await ambulance.save();
      }
    }

    await record.save();

    logger.info(`Maintenance record updated: ${record._id}`);

    res.status(200).json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: record
    });
  } catch (error) {
    logger.error('Update maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance record',
      error: error.message
    });
  }
};

/**
 * Delete maintenance record
 */
const deleteMaintenanceRecord = async (req, res) => {
  try {
    const record = await AmbulanceMaintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    await record.remove();

    logger.info(`Maintenance record deleted: ${record._id}`);

    res.status(200).json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    logger.error('Delete maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance record',
      error: error.message
    });
  }
};

/**
 * Get maintenance by ambulance
 */
const getMaintenanceByAmbulance = async (req, res) => {
  try {
    const { ambulanceId } = req.params;

    const records = await AmbulanceMaintenance.find({ ambulance: ambulanceId })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    logger.error('Get maintenance by ambulance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance by ambulance',
      error: error.message
    });
  }
};

/**
 * Get ambulance stats
 */
const getAmbulanceStats = async (req, res) => {
  try {
    const [
      total,
      available,
      onDispatch,
      maintenance,
      totalDispatches,
      completedDispatches
    ] = await Promise.all([
      Ambulance.countDocuments(),
      Ambulance.countDocuments({ status: 'Available' }),
      Ambulance.countDocuments({ status: 'On Dispatch' }),
      Ambulance.countDocuments({ status: 'Maintenance' }),
      AmbulanceDispatch.countDocuments(),
      AmbulanceDispatch.countDocuments({ status: 'Completed' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        available,
        onDispatch,
        maintenance,
        totalDispatches,
        completedDispatches,
        completionRate: totalDispatches > 0 ? Math.round((completedDispatches / totalDispatches) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get ambulance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ambulance stats',
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
      callsToday,
      dispatchesToday,
      completedToday
    ] = await Promise.all([
      EmergencyCall.countDocuments({ receivedAt: { $gte: today, $lt: tomorrow } }),
      AmbulanceDispatch.countDocuments({ dispatchedAt: { $gte: today, $lt: tomorrow } }),
      AmbulanceDispatch.countDocuments({
        completedAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        callsToday,
        dispatchesToday,
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
      callsMonth,
      dispatchesMonth,
      completedMonth
    ] = await Promise.all([
      EmergencyCall.countDocuments({ receivedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      AmbulanceDispatch.countDocuments({ dispatchedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      AmbulanceDispatch.countDocuments({
        completedAt: { $gte: startOfMonth, $lt: endOfMonth }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        callsMonth,
        dispatchesMonth,
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
    // Placeholder - would generate ambulance reports
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
 * Get live tracking
 */
const getLiveTracking = async (req, res) => {
  try {
    const activeDispatches = await AmbulanceDispatch.find({
      status: { $in: ['Dispatched', 'En Route', 'Arrived'] }
    }).populate('ambulance', 'ambulanceId vehicleNumber location');

    const trackingData = activeDispatches.map(d => ({
      dispatchId: d.dispatchId,
      ambulance: d.ambulance,
      location: d.location,
      priority: d.priority,
      status: d.status,
      dispatchedAt: d.dispatchedAt
    }));

    res.status(200).json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    logger.error('Get live tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live tracking',
      error: error.message
    });
  }
};

/**
 * Update live tracking
 */
const updateLiveTracking = async (req, res) => {
  try {
    const { dispatchId, location, status, eta } = req.body;

    const dispatch = await AmbulanceDispatch.findById(dispatchId);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    if (location) dispatch.location = location;
    if (status) dispatch.status = status;
    if (eta) dispatch.eta = eta;

    await dispatch.save();

    // Broadcast update
    sendNotification('ambulance-tracking', {
      dispatchId: dispatch.dispatchId,
      location,
      status,
      eta,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Live tracking updated',
      data: dispatch
    });
  } catch (error) {
    logger.error('Update live tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live tracking',
      error: error.message
    });
  }
};

module.exports = {
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  getAvailableAmbulances,
  getActiveAmbulances,
  getMaintenanceAmbulances,
  getDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  deleteDispatch,
  getActiveDispatches,
  getCompletedDispatches,
  assignAmbulance,
  updateDispatchStatus,
  completeDispatch,
  getAmbulanceLocation,
  updateAmbulanceLocation,
  getAmbulanceHistory,
  getEmergencyCalls,
  getEmergencyCallById,
  createEmergencyCall,
  updateEmergencyCall,
  deleteEmergencyCall,
  getActiveCalls,
  getCompletedCalls,
  getAmbulanceStaff,
  getAmbulanceStaffById,
  createAmbulanceStaff,
  updateAmbulanceStaff,
  deleteAmbulanceStaff,
  getStaffByAmbulance,
  getMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceByAmbulance,
  getAmbulanceStats,
  getDailyStats,
  getMonthlyStats,
  getReports,
  generateReport,
  getLiveTracking,
  updateLiveTracking
};
