/**
 * ============================================
 * LABORATORY.CONTROLLER.JS - Laboratory Controller
 * ============================================
 */

const Order = require('../models/LabOrder');
const Sample = require('../models/LabSample');
const Result = require('../models/LabResult');
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
      testType,
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

    const orderId = `LAB-${new Date().getFullYear()}-${String(await Order.countDocuments() + 1).padStart(4, '0')}`;

    const order = new Order({
      orderId,
      patient: patientId,
      doctor: req.user._id,
      testType,
      priority: priority || 'Routine',
      clinicalIndication,
      notes,
      status: 'Pending'
    });

    await order.save();

    logger.info(`Lab order created: ${order.orderId}`);

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
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

    const { status, priority, notes } = req.body;
    if (status) order.status = status;
    if (priority) order.priority = priority;
    if (notes) order.notes = notes;

    await order.save();

    logger.info(`Lab order updated: ${order.orderId}`);

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

    logger.info(`Lab order cancelled: ${order.orderId}`);

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
 * Get samples
 */
const getSamples = async (req, res) => {
  try {
    const { status, orderId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (orderId) query.order = orderId;

    const samples = await Sample.find(query)
      .populate('order', 'orderId testType')
      .populate('patient', 'patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: samples
    });
  } catch (error) {
    logger.error('Get samples error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get samples',
      error: error.message
    });
  }
};

/**
 * Get sample by ID
 */
const getSampleById = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id)
      .populate('order', 'orderId testType')
      .populate('patient', 'patientId');

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sample
    });
  } catch (error) {
    logger.error('Get sample by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sample',
      error: error.message
    });
  }
};

/**
 * Create sample
 */
const createSample = async (req, res) => {
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
      type,
      collectionDate,
      collectedBy,
      notes
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const sampleId = `SMP-${new Date().getFullYear()}-${String(await Sample.countDocuments() + 1).padStart(4, '0')}`;

    const sample = new Sample({
      sampleId,
      order: orderId,
      patient: order.patient,
      type,
      collectionDate: new Date(collectionDate),
      collectedBy,
      notes,
      status: 'Collected'
    });

    await sample.save();

    // Update order status
    order.status = 'Processing';
    await order.save();

    logger.info(`Lab sample created: ${sample.sampleId}`);

    res.status(201).json({
      success: true,
      message: 'Sample created successfully',
      data: sample
    });
  } catch (error) {
    logger.error('Create sample error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample',
      error: error.message
    });
  }
};

/**
 * Update sample
 */
const updateSample = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found'
      });
    }

    const { status, notes } = req.body;
    if (status) sample.status = status;
    if (notes) sample.notes = notes;

    await sample.save();

    logger.info(`Lab sample updated: ${sample.sampleId}`);

    res.status(200).json({
      success: true,
      message: 'Sample updated successfully',
      data: sample
    });
  } catch (error) {
    logger.error('Update sample error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sample',
      error: error.message
    });
  }
};

/**
 * Delete sample
 */
const deleteSample = async (req, res) => {
  try {
    const sample = await Sample.findById(req.params.id);
    if (!sample) {
      return res.status(404).json({
        success: false,
        message: 'Sample not found'
      });
    }

    await sample.remove();

    logger.info(`Lab sample deleted: ${sample.sampleId}`);

    res.status(200).json({
      success: true,
      message: 'Sample deleted successfully'
    });
  } catch (error) {
    logger.error('Delete sample error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sample',
      error: error.message
    });
  }
};

/**
 * Get test results
 */
const getTestResults = async (req, res) => {
  try {
    const { patientId, orderId } = req.query;
    let query = {};
    if (patientId) query.patient = patientId;
    if (orderId) query.order = orderId;

    const results = await Result.find(query)
      .populate('order', 'orderId testType')
      .populate('patient', 'patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test results',
      error: error.message
    });
  }
};

/**
 * Get test result by ID
 */
const getTestResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('order', 'orderId testType')
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get test result by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test result',
      error: error.message
    });
  }
};

/**
 * Create test result
 */
const createTestResult = async (req, res) => {
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
      results,
      notes,
      normalRange,
      interpretation
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const result = new Result({
      order: orderId,
      patient: order.patient,
      doctor: order.doctor,
      testType: order.testType,
      results,
      normalRange,
      interpretation,
      notes,
      status: 'Completed'
    });

    await result.save();

    // Update order status
    order.status = 'Completed';
    order.completedAt = new Date();
    await order.save();

    // Update sample status if exists
    const sample = await Sample.findOne({ order: orderId });
    if (sample) {
      sample.status = 'Reported';
      await sample.save();
    }

    logger.info(`Lab test result created for order: ${order.orderId}`);

    res.status(201).json({
      success: true,
      message: 'Test result created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Create test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test result',
      error: error.message
    });
  }
};

/**
 * Update test result
 */
const updateTestResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    const { results, normalRange, interpretation, notes } = req.body;
    if (results) result.results = results;
    if (normalRange) result.normalRange = normalRange;
    if (interpretation) result.interpretation = interpretation;
    if (notes) result.notes = notes;

    await result.save();

    logger.info(`Test result updated: ${result._id}`);

    res.status(200).json({
      success: true,
      message: 'Test result updated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Update test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test result',
      error: error.message
    });
  }
};

/**
 * Release test result
 */
const releaseTestResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    result.releasedAt = new Date();
    result.isReleased = true;
    await result.save();

    logger.info(`Test result released: ${result._id}`);

    res.status(200).json({
      success: true,
      message: 'Test result released successfully',
      data: result
    });
  } catch (error) {
    logger.error('Release test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release test result',
      error: error.message
    });
  }
};

/**
 * Get inventory
 */
const getInventory = async (req, res) => {
  try {
    // Placeholder - would query LabInventory model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory',
      error: error.message
    });
  }
};

/**
 * Get inventory item
 */
const getInventoryItem = async (req, res) => {
  try {
    // Placeholder - would query LabInventory model
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory item',
      error: error.message
    });
  }
};

/**
 * Update inventory
 */
const updateInventory = async (req, res) => {
  try {
    // Placeholder - would update LabInventory model
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully'
    });
  } catch (error) {
    logger.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

/**
 * Get equipment
 */
const getEquipment = async (req, res) => {
  try {
    // Placeholder - would query LabEquipment model
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
 * Get equipment item
 */
const getEquipmentItem = async (req, res) => {
  try {
    // Placeholder - would query LabEquipment model
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get equipment item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get equipment item',
      error: error.message
    });
  }
};

/**
 * Update equipment
 */
const updateEquipment = async (req, res) => {
  try {
    // Placeholder - would update LabEquipment model
    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    logger.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message
    });
  }
};

/**
 * Get lab stats
 */
const getLabStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalResults
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Completed' }),
      Result.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        totalResults
      }
    });
  } catch (error) {
    logger.error('Get lab stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lab stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate lab reports
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
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getPatientOrders,
  getPendingOrders,
  getCompletedOrders,
  getSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
  getTestResults,
  getTestResultById,
  createTestResult,
  updateTestResult,
  releaseTestResult,
  getInventory,
  getInventoryItem,
  updateInventory,
  getEquipment,
  getEquipmentItem,
  updateEquipment,
  getLabStats,
  getReports,
  generateReport
};
