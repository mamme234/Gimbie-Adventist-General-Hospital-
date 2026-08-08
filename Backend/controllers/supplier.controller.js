/**
 * ============================================
 * SUPPLIER.CONTROLLER.JS - Supplier Controller
 * ============================================
 */

const Supplier = require('../models/Supplier');
const SupplierContract = require('../models/SupplierContract');
const SupplierProduct = require('../models/SupplierProduct');
const SupplierOrder = require('../models/SupplierOrder');
const SupplierPayment = require('../models/SupplierPayment');
const SupplierRating = require('../models/SupplierRating');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all suppliers
 */
const getSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suppliers',
      error: error.message
    });
  }
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    logger.error('Get supplier by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier',
      error: error.message
    });
  }
};

/**
 * Create supplier
 */
const createSupplier = async (req, res) => {
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
      contact,
      phone,
      email,
      address,
      taxId,
      website,
      paymentTerms,
      notes
    } = req.body;

    const supplier = new Supplier({
      name,
      contact,
      phone,
      email,
      address,
      taxId,
      website,
      paymentTerms: paymentTerms || 'Net 30',
      notes,
      status: 'Active'
    });

    await supplier.save();

    logger.info(`Supplier created: ${supplier.name}`);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    logger.error('Create supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    });
  }
};

/**
 * Update supplier
 */
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const {
      name,
      contact,
      phone,
      email,
      address,
      taxId,
      website,
      paymentTerms,
      status,
      notes
    } = req.body;

    if (name) supplier.name = name;
    if (contact) supplier.contact = contact;
    if (phone) supplier.phone = phone;
    if (email) supplier.email = email;
    if (address) supplier.address = address;
    if (taxId) supplier.taxId = taxId;
    if (website) supplier.website = website;
    if (paymentTerms) supplier.paymentTerms = paymentTerms;
    if (status) supplier.status = status;
    if (notes) supplier.notes = notes;

    await supplier.save();

    logger.info(`Supplier updated: ${supplier.name}`);

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    logger.error('Update supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    });
  }
};

/**
 * Delete supplier
 */
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.status = 'Inactive';
    await supplier.save();

    logger.info(`Supplier deactivated: ${supplier.name}`);

    res.status(200).json({
      success: true,
      message: 'Supplier deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate supplier',
      error: error.message
    });
  }
};

/**
 * Search suppliers
 */
const searchSuppliers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { contact: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ],
      status: 'Active'
    }).limit(20);

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    logger.error('Search suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search suppliers',
      error: error.message
    });
  }
};

/**
 * Get active suppliers
 */
const getActiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ status: 'Active' }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    logger.error('Get active suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active suppliers',
      error: error.message
    });
  }
};

/**
 * Get inactive suppliers
 */
const getInactiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ status: 'Inactive' }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    logger.error('Get inactive suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inactive suppliers',
      error: error.message
    });
  }
};

/**
 * Get contracts
 */
const getContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, supplierId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (supplierId) query.supplier = supplierId;
    if (status) query.status = status;

    const contracts = await SupplierContract.find(query)
      .populate('supplier', 'name contact')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startDate: -1 });

    const total = await SupplierContract.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contracts',
      error: error.message
    });
  }
};

/**
 * Get contract by ID
 */
const getContractById = async (req, res) => {
  try {
    const contract = await SupplierContract.findById(req.params.id)
      .populate('supplier', 'name contact phone email');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Get contract by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contract',
      error: error.message
    });
  }
};

/**
 * Create contract
 */
const createContract = async (req, res) => {
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
      supplierId,
      startDate,
      endDate,
      terms,
      conditions,
      paymentTerms,
      notes
    } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const contract = new SupplierContract({
      supplier: supplierId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      terms,
      conditions: conditions || [],
      paymentTerms: paymentTerms || 'Net 30',
      notes,
      status: 'Active'
    });

    await contract.save();

    logger.info(`Contract created for supplier: ${supplier.name}`);

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contract',
      error: error.message
    });
  }
};

/**
 * Update contract
 */
const updateContract = async (req, res) => {
  try {
    const contract = await SupplierContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    const {
      startDate,
      endDate,
      terms,
      conditions,
      paymentTerms,
      status,
      notes
    } = req.body;

    if (startDate) contract.startDate = new Date(startDate);
    if (endDate) contract.endDate = new Date(endDate);
    if (terms) contract.terms = terms;
    if (conditions) contract.conditions = conditions;
    if (paymentTerms) contract.paymentTerms = paymentTerms;
    if (status) contract.status = status;
    if (notes) contract.notes = notes;

    await contract.save();

    logger.info(`Contract updated: ${contract._id}`);

    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: contract
    });
  } catch (error) {
    logger.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contract',
      error: error.message
    });
  }
};

/**
 * Delete contract
 */
const deleteContract = async (req, res) => {
  try {
    const contract = await SupplierContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    contract.status = 'Terminated';
    await contract.save();

    logger.info(`Contract terminated: ${contract._id}`);

    res.status(200).json({
      success: true,
      message: 'Contract terminated successfully'
    });
  } catch (error) {
    logger.error('Delete contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate contract',
      error: error.message
    });
  }
};

/**
 * Get supplier contracts
 */
const getSupplierContracts = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const contracts = await SupplierContract.find({ supplier: supplierId })
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Get supplier contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier contracts',
      error: error.message
    });
  }
};

/**
 * Get active contracts
 */
const getActiveContracts = async (req, res) => {
  try {
    const contracts = await SupplierContract.find({
      status: 'Active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
      .populate('supplier', 'name contact')
      .sort({ endDate: 1 });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Get active contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active contracts',
      error: error.message
    });
  }
};

/**
 * Get expiring contracts
 */
const getExpiringContracts = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const contracts = await SupplierContract.find({
      status: 'Active',
      endDate: { $lte: thirtyDaysFromNow }
    })
      .populate('supplier', 'name contact')
      .sort({ endDate: 1 });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Get expiring contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring contracts',
      error: error.message
    });
  }
};

/**
 * Get supplier products
 */
const getSupplierProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, supplierId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (supplierId) query.supplier = supplierId;

    const products = await SupplierProduct.find(query)
      .populate('supplier', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await SupplierProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get supplier products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier products',
      error: error.message
    });
  }
};

/**
 * Get supplier product by ID
 */
const getSupplierProductById = async (req, res) => {
  try {
    const product = await SupplierProduct.findById(req.params.id)
      .populate('supplier', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get supplier product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
};

/**
 * Create supplier product
 */
const createSupplierProduct = async (req, res) => {
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
      supplierId,
      name,
      description,
      price,
      minOrderQuantity,
      leadTime,
      availability,
      notes
    } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const product = new SupplierProduct({
      supplier: supplierId,
      name,
      description,
      price,
      minOrderQuantity: minOrderQuantity || 1,
      leadTime: leadTime || '3-5 days',
      availability: availability || true,
      notes,
      isActive: true
    });

    await product.save();

    logger.info(`Product added for supplier: ${supplier.name}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Create supplier product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

/**
 * Update supplier product
 */
const updateSupplierProduct = async (req, res) => {
  try {
    const product = await SupplierProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      description,
      price,
      minOrderQuantity,
      leadTime,
      availability,
      isActive,
      notes
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (minOrderQuantity) product.minOrderQuantity = minOrderQuantity;
    if (leadTime) product.leadTime = leadTime;
    if (availability !== undefined) product.availability = availability;
    if (isActive !== undefined) product.isActive = isActive;
    if (notes) product.notes = notes;

    await product.save();

    logger.info(`Product updated: ${product.name}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Update supplier product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

/**
 * Delete supplier product
 */
const deleteSupplierProduct = async (req, res) => {
  try {
    const product = await SupplierProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = false;
    await product.save();

    logger.info(`Product deactivated: ${product.name}`);

    res.status(200).json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete supplier product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate product',
      error: error.message
    });
  }
};

/**
 * Get products by supplier
 */
const getProductsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const products = await SupplierProduct.find({
      supplier: supplierId,
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    logger.error('Get products by supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products by supplier',
      error: error.message
    });
  }
};

/**
 * Get supplier orders
 */
const getSupplierOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, supplierId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (supplierId) query.supplier = supplierId;
    if (status) query.status = status;

    const orders = await SupplierOrder.find(query)
      .populate('supplier', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ orderDate: -1 });

    const total = await SupplierOrder.countDocuments(query);

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
    logger.error('Get supplier orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier orders',
      error: error.message
    });
  }
};

/**
 * Get supplier order by ID
 */
const getSupplierOrderById = async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id)
      .populate('supplier', 'name contact');

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
    logger.error('Get supplier order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
};

/**
 * Create supplier order
 */
const createSupplierOrder = async (req, res) => {
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
      supplierId,
      items,
      expectedDelivery,
      priority,
      notes
    } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const order = new SupplierOrder({
      supplier: supplierId,
      items,
      totalAmount,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      priority: priority || 'Normal',
      notes,
      status: 'Pending',
      orderDate: new Date()
    });

    await order.save();

    logger.info(`Supplier order created for: ${supplier.name}`);

    res.status(201).json({
      success: true,
      message: 'Supplier order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Create supplier order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier order',
      error: error.message
    });
  }
};

/**
 * Update supplier order
 */
const updateSupplierOrder = async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const {
      items,
      expectedDelivery,
      priority,
      status,
      notes
    } = req.body;

    if (items) {
      order.items = items;
      order.totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    if (expectedDelivery) order.expectedDelivery = new Date(expectedDelivery);
    if (priority) order.priority = priority;
    if (status) order.status = status;
    if (notes) order.notes = notes;

    if (status === 'Received') {
      order.receivedAt = new Date();
    }

    await order.save();

    logger.info(`Supplier order updated: ${order._id}`);

    res.status(200).json({
      success: true,
      message: 'Supplier order updated successfully',
      data: order
    });
  } catch (error) {
    logger.error('Update supplier order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier order',
      error: error.message
    });
  }
};

/**
 * Delete supplier order
 */
const deleteSupplierOrder = async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    logger.info(`Supplier order cancelled: ${order._id}`);

    res.status(200).json({
      success: true,
      message: 'Supplier order cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete supplier order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel supplier order',
      error: error.message
    });
  }
};

/**
 * Get orders by supplier
 */
const getOrdersBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const orders = await SupplierOrder.find({ supplier: supplierId })
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Get orders by supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders by supplier',
      error: error.message
    });
  }
};

/**
 * Get supplier payments
 */
const getSupplierPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, supplierId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (supplierId) query.supplier = supplierId;
    if (status) query.status = status;

    const payments = await SupplierPayment.find(query)
      .populate('supplier', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ paymentDate: -1 });

    const total = await SupplierPayment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get supplier payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier payments',
      error: error.message
    });
  }
};

/**
 * Get supplier payment by ID
 */
const getSupplierPaymentById = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id)
      .populate('supplier', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Get supplier payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message
    });
  }
};

/**
 * Create supplier payment
 */
const createSupplierPayment = async (req, res) => {
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
      supplierId,
      amount,
      method,
      reference,
      notes
    } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const payment = new SupplierPayment({
      supplier: supplierId,
      amount,
      method: method || 'Bank Transfer',
      reference,
      notes,
      status: 'Completed',
      paymentDate: new Date()
    });

    await payment.save();

    logger.info(`Payment made to supplier: ${supplier.name} - ${amount}`);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Create supplier payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

/**
 * Update supplier payment
 */
const updateSupplierPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const { method, reference, status, notes } = req.body;

    if (method) payment.method = method;
    if (reference) payment.reference = reference;
    if (status) payment.status = status;
    if (notes) payment.notes = notes;

    await payment.save();

    logger.info(`Payment updated: ${payment._id}`);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Update supplier payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

/**
 * Delete supplier payment
 */
const deleteSupplierPayment = async (req, res) => {
  try {
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await payment.remove();

    logger.info(`Payment deleted: ${payment._id}`);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete supplier payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
};

/**
 * Get payments by supplier
 */
const getPaymentsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const payments = await SupplierPayment.find({ supplier: supplierId })
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get payments by supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments by supplier',
      error: error.message
    });
  }
};

/**
 * Get supplier ratings
 */
const getSupplierRatings = async (req, res) => {
  try {
    const { page = 1, limit = 20, supplierId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (supplierId) query.supplier = supplierId;

    const ratings = await SupplierRating.find(query)
      .populate('supplier', 'name')
      .populate('ratedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await SupplierRating.countDocuments(query);

    res.status(200).json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get supplier ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier ratings',
      error: error.message
    });
  }
};

/**
 * Create supplier rating
 */
const createSupplierRating = async (req, res) => {
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
      supplierId,
      rating,
      feedback,
      categories
    } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const supplierRating = new SupplierRating({
      supplier: supplierId,
      rating,
      feedback,
      categories: categories || {},
      ratedBy: req.user._id,
      createdAt: new Date()
    });

    await supplierRating.save();

    // Update supplier average rating
    const allRatings = await SupplierRating.find({ supplier: supplierId });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    supplier.averageRating = Math.round(avgRating * 10) / 10;
    await supplier.save();

    logger.info(`Rating given to supplier: ${supplier.name}`);

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: supplierRating
    });
  } catch (error) {
    logger.error('Create supplier rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rating',
      error: error.message
    });
  }
};

/**
 * Update supplier rating
 */
const updateSupplierRating = async (req, res) => {
  try {
    const rating = await SupplierRating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    const { rating: newRating, feedback, categories } = req.body;

    if (newRating) rating.rating = newRating;
    if (feedback) rating.feedback = feedback;
    if (categories) rating.categories = categories;

    await rating.save();

    // Update supplier average rating
    const allRatings = await SupplierRating.find({ supplier: rating.supplier });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    const supplier = await Supplier.findById(rating.supplier);
    if (supplier) {
      supplier.averageRating = Math.round(avgRating * 10) / 10;
      await supplier.save();
    }

    logger.info(`Rating updated: ${rating._id}`);

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: rating
    });
  } catch (error) {
    logger.error('Update supplier rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating',
      error: error.message
    });
  }
};

/**
 * Delete supplier rating
 */
const deleteSupplierRating = async (req, res) => {
  try {
    const rating = await SupplierRating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    const supplierId = rating.supplier;
    await rating.remove();

    // Update supplier average rating
    const allRatings = await SupplierRating.find({ supplier: supplierId });
    const avgRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
      : 0;
    const supplier = await Supplier.findById(supplierId);
    if (supplier) {
      supplier.averageRating = Math.round(avgRating * 10) / 10;
      await supplier.save();
    }

    logger.info(`Rating deleted: ${rating._id}`);

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    logger.error('Delete supplier rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: error.message
    });
  }
};

/**
 * Get supplier reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate supplier reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get supplier reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier reports',
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
 * Get supplier stats
 */
const getSupplierStats = async (req, res) => {
  try {
    const [
      totalSuppliers,
      activeSuppliers,
      totalContracts,
      totalOrders,
      totalPayments
    ] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ status: 'Active' }),
      SupplierContract.countDocuments({ status: 'Active' }),
      SupplierOrder.countDocuments(),
      SupplierPayment.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        totalContracts,
        totalOrders,
        totalPayments
      }
    });
  } catch (error) {
    logger.error('Get supplier stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supplier stats',
      error: error.message
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  getActiveSuppliers,
  getInactiveSuppliers,
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getSupplierContracts,
  getActiveContracts,
  getExpiringContracts,
  getSupplierProducts,
  getSupplierProductById,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
  getProductsBySupplier,
  getSupplierOrders,
  getSupplierOrderById,
  createSupplierOrder,
  updateSupplierOrder,
  deleteSupplierOrder,
  getOrdersBySupplier,
  getSupplierPayments,
  getSupplierPaymentById,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  getPaymentsBySupplier,
  getSupplierRatings,
  createSupplierRating,
  updateSupplierRating,
  deleteSupplierRating,
  getReports,
  generateReport,
  getSupplierStats
};
