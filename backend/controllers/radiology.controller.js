/**
 * ============================================
 * RADIOLOGY.CONTROLLER.JS - Radiology Controller
 * ============================================
 */

const Order = require('../models/RadiologyOrder');
const Study = require('../models/RadiologyStudy');
const Report = require('../models/RadiologyReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all orders
 */
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (priority) query.priority = priority;

    const orders = await Order.find(query)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

/**
 * Create order
 */
const createOrder = async (req, res) => {
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
      studyType,
      bodyRegion,
      priority,
      clinicalIndication,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const orderId = `RAD-${new Date().getFullYear()}-${String(await Order.countDocuments() + 1).padStart(4, '0')}`;

    const order = new Order({
      orderId,
      patient: patientId,
      doctor: req.user._id,
      studyType,
      bodyRegion,
      priority: priority || 'Routine',
      clinicalIndication,
      notes,
      status: 'Pending'
    });

    await order.save();

    logger.info(`Radiology order created: ${order.orderId}`);

    res.status(201).json({
      success: true,
      message: 'Radiology order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

/**
 * Update order
 */
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const { status, priority, notes, scheduledDate } = req.body;
    if (status) order.status = status;
    if (priority) order.priority = priority;
    if (notes) order.notes = notes;
    if (scheduledDate) order.scheduledDate = new Date(scheduledDate);

    await order.save();

    logger.info(`Radiology order updated: ${order.orderId}`);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

/**
 * Delete order
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    logger.info(`Radiology order cancelled: ${order.orderId}`);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

/**
 * Get patient orders
 */
const getPatientOrders = async (req, res) => {
  try {
    const { patientId } = req.params;

    const orders = await Order.find({ patient: patientId })
      .populate('doctor', 'doctorId specialty')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Get patient orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient orders',
      error: error.message
    });
  }
};

/**
 * Get pending orders
 */
const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ priority: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Get pending orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending orders',
      error: error.message
    });
  }
};

/**
 * Get completed orders
 */
const getCompletedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Completed' })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Get completed orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed orders',
      error: error.message
    });
  }
};

/**
 * Get studies
 */
const getStudies = async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;

    const studies = await Study.find(query)
      .populate('order', 'orderId studyType')
      .populate('patient', 'patientId')
      .populate('radiologist', 'doctorId specialty')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: studies
    });
  } catch (error) {
    logger.error('Get studies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get studies',
      error: error.message
    });
  }
};

/**
 * Get study by ID
 */
const getStudyById = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id)
      .populate('order', 'orderId studyType')
      .populate('patient', 'patientId')
      .populate('radiologist', 'doctorId specialty');

    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    res.status(200).json({
      success: true,
      data: study
    });
  } catch (error) {
    logger.error('Get study by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get study',
      error: error.message
    });
  }
};

/**
 * Create study
 */
const createStudy = async (req, res) => {
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
      orderId,
      modality,
      bodyRegion,
      technique,
      findings,
      impression,
      recommendations
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const studyId = `STD-${new Date().getFullYear()}-${String(await Study.countDocuments() + 1).padStart(4, '0')}`;

    const study = new Study({
      studyId,
      order: orderId,
      patient: order.patient,
      radiologist: req.user._id,
      modality,
      bodyRegion,
      technique,
      findings,
      impression,
      recommendations,
      status: 'Pending'
    });

    await study.save();

    // Update order status
    order.status = 'In Progress';
    await order.save();

    logger.info(`Radiology study created: ${study.studyId}`);

    res.status(201).json({
      success: true,
      message: 'Study created successfully',
      data: study
    });
  } catch (error) {
    logger.error('Create study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study',
      error: error.message
    });
  }
};

/**
 * Update study
 */
const updateStudy = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    const {
      findings,
      impression,
      recommendations,
      status,
      images
    } = req.body;

    if (findings) study.findings = findings;
    if (impression) study.impression = impression;
    if (recommendations) study.recommendations = recommendations;
    if (status) study.status = status;
    if (images) study.images = images;

    await study.save();

    logger.info(`Radiology study updated: ${study.studyId}`);

    res.status(200).json({
      success: true,
      message: 'Study updated successfully',
      data: study
    });
  } catch (error) {
    logger.error('Update study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study',
      error: error.message
    });
  }
};

/**
 * Delete study
 */
const deleteStudy = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    await study.remove();

    logger.info(`Radiology study deleted: ${study.studyId}`);

    res.status(200).json({
      success: true,
      message: 'Study deleted successfully'
    });
  } catch (error) {
    logger.error('Delete study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study',
      error: error.message
    });
  }
};

/**
 * Get study images
 */
const getStudyImages = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    res.status(200).json({
      success: true,
      data: study.images || []
    });
  } catch (error) {
    logger.error('Get study images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get study images',
      error: error.message
    });
  }
};

/**
 * Upload study images
 */
const uploadStudyImages = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const images = req.files.map(file => ({
      url: `/uploads/radiology/${file.filename}`,
      filename: file.filename,
      size: file.size,
      uploadedAt: new Date()
    }));

    study.images = [...(study.images || []), ...images];
    await study.save();

    logger.info(`Images uploaded for study: ${study.studyId}`);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: images
    });
  } catch (error) {
    logger.error('Upload study images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Delete study image
 */
const deleteStudyImage = async (req, res) => {
  try {
    const study = await Study.findById(req.params.id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    const { imageId } = req.params;
    study.images = study.images.filter(img => img._id.toString() !== imageId);
    await study.save();

    logger.info(`Image deleted from study: ${study.studyId}`);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete study image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    const { patientId, studyId } = req.query;
    let query = {};
    if (patientId) query.patient = patientId;
    if (studyId) query.study = studyId;

    const reports = await Report.find(query)
      .populate('study', 'studyId modality')
      .populate('patient', 'patientId')
      .populate('radiologist', 'doctorId specialty')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports
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
 * Get report by ID
 */
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('study', 'studyId modality findings')
      .populate('patient', 'patientId')
      .populate('radiologist', 'doctorId specialty');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report',
      error: error.message
    });
  }
};

/**
 * Create report
 */
const createReport = async (req, res) => {
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
      studyId,
      findings,
      impression,
      recommendations,
      notes
    } = req.body;

    const study = await Study.findById(studyId);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    const reportId = `RPT-${new Date().getFullYear()}-${String(await Report.countDocuments() + 1).padStart(4, '0')}`;

    const report = new Report({
      reportId,
      study: studyId,
      patient: study.patient,
      radiologist: req.user._id,
      findings,
      impression,
      recommendations,
      notes,
      status: 'Draft'
    });

    await report.save();

    // Update study status
    study.status = 'Reported';
    await study.save();

    // Update order status
    const order = await Order.findById(study.order);
    if (order) {
      order.status = 'Completed';
      order.completedAt = new Date();
      await order.save();
    }

    logger.info(`Radiology report created: ${report.reportId}`);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
};

/**
 * Update report
 */
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const { findings, impression, recommendations, notes, status } = req.body;
    if (findings) report.findings = findings;
    if (impression) report.impression = impression;
    if (recommendations) report.recommendations = recommendations;
    if (notes) report.notes = notes;
    if (status) report.status = status;

    await report.save();

    logger.info(`Radiology report updated: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
};

/**
 * Release report
 */
const releaseReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = 'Released';
    report.releasedAt = new Date();
    await report.save();

    logger.info(`Radiology report released: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report released successfully',
      data: report
    });
  } catch (error) {
    logger.error('Release report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release report',
      error: error.message
    });
  }
};

/**
 * Get equipment
 */
const getEquipment = async (req, res) => {
  try {
    // Placeholder - would query RadiologyEquipment model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get equipment',
      error: error.message
    });
  }
};

/**
 * Get equipment by ID
 */
const getEquipmentById = async (req, res) => {
  try {
    // Placeholder - would query RadiologyEquipment model
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get equipment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get equipment',
      error: error.message
    });
  }
};

/**
 * Update equipment status
 */
const updateEquipmentStatus = async (req, res) => {
  try {
    // Placeholder - would update RadiologyEquipment model
    res.status(200).json({
      success: true,
      message: 'Equipment status updated successfully'
    });
  } catch (error) {
    logger.error('Update equipment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment status',
      error: error.message
    });
  }
};

/**
 * Schedule maintenance
 */
const scheduleMaintenance = async (req, res) => {
  try {
    // Placeholder - would create Maintenance record
    res.status(200).json({
      success: true,
      message: 'Maintenance scheduled successfully'
    });
  } catch (error) {
    logger.error('Schedule maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance',
      error: error.message
    });
  }
};

/**
 * Get equipment maintenance
 */
const getEquipmentMaintenance = async (req, res) => {
  try {
    // Placeholder - would query Maintenance records
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get equipment maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get equipment maintenance',
      error: error.message
    });
  }
};

/**
 * Get radiology stats
 */
const getRadiologyStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalStudies,
      totalReports
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Completed' }),
      Study.countDocuments(),
      Report.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalStudies,
        totalReports
      }
    });
  } catch (error) {
    logger.error('Get radiology stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get radiology stats',
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

    const [ordersToday, studiesToday, reportsToday] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Study.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Report.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        ordersToday,
        studiesToday,
        reportsToday
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

    const [ordersMonth, studiesMonth, reportsMonth] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      Study.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      Report.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        ordersMonth,
        studiesMonth,
        reportsMonth
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
 * Get appointments
 */
const getAppointments = async (req, res) => {
  try {
    // Placeholder - would query RadiologyAppointment model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

/**
 * Get appointment by ID
 */
const getAppointmentById = async (req, res) => {
  try {
    // Placeholder - would query RadiologyAppointment model
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
};

/**
 * Create appointment
 */
const createAppointment = async (req, res) => {
  try {
    // Placeholder - would create RadiologyAppointment
    res.status(201).json({
      success: true,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

/**
 * Update appointment
 */
const updateAppointment = async (req, res) => {
  try {
    // Placeholder - would update RadiologyAppointment
    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res) => {
  try {
    // Placeholder - would cancel RadiologyAppointment
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

/**
 * Get available slots
 */
const getAvailableSlots = async (req, res) => {
  try {
    // Placeholder - would get available slots
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: error.message
    });
  }
};

/**
 * Get images
 */
const getImages = async (req, res) => {
  try {
    // Placeholder - would get images
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get images',
      error: error.message
    });
  }
};

/**
 * Get image by ID
 */
const getImageById = async (req, res) => {
  try {
    // Placeholder - would get image
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get image by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image',
      error: error.message
    });
  }
};

/**
 * Delete image
 */
const deleteImage = async (req, res) => {
  try {
    // Placeholder - would delete image
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

/**
 * Get image thumbnail
 */
const getImageThumbnail = async (req, res) => {
  try {
    // Placeholder - would get image thumbnail
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get image thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image thumbnail',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getPatientOrders,
  getPendingOrders,
  getCompletedOrders,
  getStudies,
  getStudyById,
  createStudy,
  updateStudy,
  deleteStudy,
  getStudyImages,
  uploadStudyImages,
  deleteStudyImage,
  getReports,
  getReportById,
  createReport,
  updateReport,
  releaseReport,
  getEquipment,
  getEquipmentById,
  updateEquipmentStatus,
  scheduleMaintenance,
  getEquipmentMaintenance,
  getRadiologyStats,
  getDailyStats,
  getMonthlyStats,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  getImages,
  getImageById,
  deleteImage,
  getImageThumbnail
};
