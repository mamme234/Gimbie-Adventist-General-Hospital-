/**
 * ============================================
 * INVENTORY.CONTROLLER.JS - Inventory Controller
 * ============================================
 */

const InventoryItem = require('../models/InventoryItem');
const InventoryCategory = require('../models/InventoryCategory');
const InventoryLocation = require('../models/InventoryLocation');
const StockMovement = require('../models/StockMovement');
const StockAlert = require('../models/StockAlert');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all inventory items
 */
const getItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status, location } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await InventoryItem.find(query)
      .populate('category', 'name')
      .populate('location', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await InventoryItem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory items',
      error: error.message
    });
  }
};

/**
 * Get item by ID
 */
const getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id)
      .populate('category', 'name')
      .populate('location', 'name');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Get inventory item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory item',
      error: error.message
    });
  }
};

/**
 * Create inventory item
 */
const createItem = async (req, res) => {
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
      sku,
      categoryId,
      description,
      unit,
      quantity,
      reorderLevel,
      maxStockLevel,
      unitPrice,
      locationId,
      expiryDate,
      batchNumber,
      manufacturer,
      supplier,
      notes
    } = req.body;

    // Generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      const prefix = name.substring(0, 3).toUpperCase();
      const count = await InventoryItem.countDocuments();
      finalSku = `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }

    const item = new InventoryItem({
      name,
      sku: finalSku,
      category: categoryId,
      description,
      unit: unit || 'Unit',
      quantity: quantity || 0,
      reorderLevel: reorderLevel || 5,
      maxStockLevel: maxStockLevel || 100,
      unitPrice: unitPrice || 0,
      location: locationId,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber,
      manufacturer,
      supplier,
      notes,
      status: 'Active'
    });

    await item.save();

    // Create stock movement record
    if (quantity && quantity > 0) {
      const movement = new StockMovement({
        item: item._id,
        type: 'Add',
        quantity: quantity,
        reason: 'Initial stock',
        performedBy: req.user._id,
        date: new Date()
      });
      await movement.save();
    }

    logger.info(`Inventory item created: ${item.name} (${item.sku})`);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: item
    });
  } catch (error) {
    logger.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message
    });
  }
};

/**
 * Update inventory item
 */
const updateItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const {
      name,
      description,
      unit,
      reorderLevel,
      maxStockLevel,
      unitPrice,
      locationId,
      expiryDate,
      batchNumber,
      manufacturer,
      supplier,
      status,
      notes
    } = req.body;

    if (name) item.name = name;
    if (description) item.description = description;
    if (unit) item.unit = unit;
    if (reorderLevel) item.reorderLevel = reorderLevel;
    if (maxStockLevel) item.maxStockLevel = maxStockLevel;
    if (unitPrice) item.unitPrice = unitPrice;
    if (locationId) item.location = locationId;
    if (expiryDate) item.expiryDate = new Date(expiryDate);
    if (batchNumber) item.batchNumber = batchNumber;
    if (manufacturer) item.manufacturer = manufacturer;
    if (supplier) item.supplier = supplier;
    if (status) item.status = status;
    if (notes) item.notes = notes;

    await item.save();

    logger.info(`Inventory item updated: ${item.name}`);

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    logger.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
};

/**
 * Delete inventory item
 */
const deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    item.status = 'Discontinued';
    await item.save();

    logger.info(`Inventory item discontinued: ${item.name}`);

    res.status(200).json({
      success: true,
      message: 'Inventory item discontinued successfully'
    });
  } catch (error) {
    logger.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discontinue inventory item',
      error: error.message
    });
  }
};

/**
 * Search items
 */
const searchItems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const items = await InventoryItem.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } }
      ],
      status: 'Active'
    })
      .populate('category', 'name')
      .populate('location', 'name')
      .limit(20);

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Search inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search inventory items',
      error: error.message
    });
  }
};

/**
 * Get items by category
 */
const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const items = await InventoryItem.find({
      category: categoryId,
      status: 'Active'
    })
      .populate('location', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items by category',
      error: error.message
    });
  }
};

/**
 * Get low stock items
 */
const getLowStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      status: 'Active'
    })
      .populate('category', 'name')
      .populate('location', 'name')
      .sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock items',
      error: error.message
    });
  }
};

/**
 * Get out of stock items
 */
const getOutOfStockItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      quantity: 0,
      status: 'Active'
    })
      .populate('category', 'name')
      .populate('location', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get out of stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get out of stock items',
      error: error.message
    });
  }
};

/**
 * Get stock levels
 */
const getStockLevels = async (req, res) => {
  try {
    const items = await InventoryItem.find({ status: 'Active' })
      .populate('category', 'name')
      .populate('location', 'name')
      .select('name sku quantity reorderLevel maxStockLevel unit')
      .sort({ name: 1 });

    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      lowStock: items.filter(item => item.quantity <= item.reorderLevel).length,
      outOfStock: items.filter(item => item.quantity === 0).length
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        items
      }
    });
  } catch (error) {
    logger.error('Get stock levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock levels',
      error: error.message
    });
  }
};

/**
 * Update stock level
 */
const updateStockLevel = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const { quantity, reason } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    const oldQuantity = item.quantity;
    const difference = quantity - oldQuantity;

    item.quantity = quantity;
    await item.save();

    // Record movement
    if (difference !== 0) {
      const movement = new StockMovement({
        item: item._id,
        type: difference > 0 ? 'Add' : 'Remove',
        quantity: Math.abs(difference),
        reason: reason || 'Manual adjustment',
        performedBy: req.user._id,
        date: new Date()
      });
      await movement.save();
    }

    // Check if alert needed
    if (item.quantity <= item.reorderLevel) {
      await checkAndCreateAlert(item);
    }

    logger.info(`Stock updated for item: ${item.name} - ${oldQuantity} -> ${quantity}`);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: item
    });
  } catch (error) {
    logger.error('Update stock level error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock level',
      error: error.message
    });
  }
};

/**
 * Adjust stock
 */
const adjustStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { itemId, quantity, type, reason } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const oldQuantity = item.quantity;

    if (type === 'Add') {
      item.quantity += quantity;
    } else if (type === 'Remove') {
      if (item.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      item.quantity -= quantity;
    } else {
      item.quantity = quantity;
    }

    await item.save();

    // Record movement
    const movement = new StockMovement({
      item: item._id,
      type: type === 'Add' ? 'Add' : (type === 'Remove' ? 'Remove' : 'Adjust'),
      quantity: type === 'Add' ? quantity : (type === 'Remove' ? quantity : Math.abs(quantity - oldQuantity)),
      reason: reason || 'Stock adjustment',
      performedBy: req.user._id,
      date: new Date()
    });
    await movement.save();

    // Check if alert needed
    if (item.quantity <= item.reorderLevel) {
      await checkAndCreateAlert(item);
    }

    logger.info(`Stock adjusted for item: ${item.name} - ${oldQuantity} -> ${item.quantity}`);

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: item
    });
  } catch (error) {
    logger.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message
    });
  }
};

/**
 * Transfer stock
 */
const transferStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { itemId, fromLocationId, toLocationId, quantity, reason } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Update item location
    item.location = toLocationId;
    await item.save();

    // Record movements
    const fromMovement = new StockMovement({
      item: item._id,
      type: 'Remove',
      quantity: quantity,
      reason: `Transfer to ${toLocationId}`,
      performedBy: req.user._id,
      date: new Date(),
      fromLocation: fromLocationId,
      toLocation: toLocationId
    });
    await fromMovement.save();

    // Check if alert needed
    if (item.quantity <= item.reorderLevel) {
      await checkAndCreateAlert(item);
    }

    logger.info(`Stock transferred for item: ${item.name} - ${quantity} units`);

    res.status(200).json({
      success: true,
      message: 'Stock transferred successfully',
      data: item
    });
  } catch (error) {
    logger.error('Transfer stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer stock',
      error: error.message
    });
  }
};

/**
 * Get stock movements
 */
const getStockMovements = async (req, res) => {
  try {
    const { page = 1, limit = 20, itemId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (itemId) query.item = itemId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .populate('item', 'name sku')
      .populate('performedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await StockMovement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get stock movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock movements',
      error: error.message
    });
  }
};

/**
 * Get stock history
 */
const getStockHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 50 } = req.query;

    const movements = await StockMovement.find({ item: itemId })
      .populate('performedBy', 'firstName lastName')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    const item = await InventoryItem.findById(itemId);

    res.status(200).json({
      success: true,
      data: {
        item,
        movements
      }
    });
  } catch (error) {
    logger.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock history',
      error: error.message
    });
  }
};

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await InventoryCategory.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get inventory categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory categories',
      error: error.message
    });
  }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await InventoryCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
};

/**
 * Create category
 */
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    const category = new InventoryCategory({
      name,
      description,
      isActive: true
    });

    await category.save();

    logger.info(`Inventory category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * Update category
 */
const updateCategory = async (req, res) => {
  try {
    const category = await InventoryCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, isActive } = req.body;

    if (name) category.name = name;
    if (description) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    logger.info(`Category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * Delete category
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await InventoryCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate category',
      error: error.message
    });
  }
};

/**
 * Get locations
 */
const getLocations = async (req, res) => {
  try {
    const locations = await InventoryLocation.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Get inventory locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory locations',
      error: error.message
    });
  }
};

/**
 * Get location by ID
 */
const getLocationById = async (req, res) => {
  try {
    const location = await InventoryLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    logger.error('Get location by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message
    });
  }
};

/**
 * Create location
 */
const createLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, type, address, contact, notes } = req.body;

    const location = new InventoryLocation({
      name,
      type: type || 'Warehouse',
      address,
      contact,
      notes,
      isActive: true
    });

    await location.save();

    logger.info(`Inventory location created: ${location.name}`);

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    logger.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

/**
 * Update location
 */
const updateLocation = async (req, res) => {
  try {
    const location = await InventoryLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const { name, type, address, contact, isActive, notes } = req.body;

    if (name) location.name = name;
    if (type) location.type = type;
    if (address) location.address = address;
    if (contact) location.contact = contact;
    if (isActive !== undefined) location.isActive = isActive;
    if (notes) location.notes = notes;

    await location.save();

    logger.info(`Location updated: ${location.name}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * Delete location
 */
const deleteLocation = async (req, res) => {
  try {
    const location = await InventoryLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    location.isActive = false;
    await location.save();

    logger.info(`Location deactivated: ${location.name}`);

    res.status(200).json({
      success: true,
      message: 'Location deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate location',
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

    const alerts = await StockAlert.find(query)
      .populate('item', 'name sku quantity reorderLevel')
      .populate('createdBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
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

    const { itemId, type, threshold, message } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const alert = new StockAlert({
      item: itemId,
      type: type || 'Low Stock',
      threshold: threshold || item.reorderLevel,
      message: message || `${item.name} is running low on stock`,
      createdBy: req.user._id,
      resolved: false
    });

    await alert.save();

    logger.info(`Stock alert created for item: ${item.name}`);

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
    const alert = await StockAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    const { threshold, message, resolved } = req.body;

    if (threshold) alert.threshold = threshold;
    if (message) alert.message = message;
    if (resolved !== undefined) alert.resolved = resolved;

    if (resolved === true) {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    logger.info(`Alert updated: ${alert._id}`);

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
    const alert = await StockAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.resolved = true;
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();

    logger.info(`Alert resolved: ${alert._id}`);

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

/**
 * Get low stock alerts
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      status: 'Active'
    })
      .populate('category', 'name')
      .populate('location', 'name')
      .sort({ quantity: 1 });

    // Create alerts for items without active alerts
    for (const item of items) {
      const existingAlert = await StockAlert.findOne({
        item: item._id,
        resolved: false,
        type: 'Low Stock'
      });
      if (!existingAlert) {
        await checkAndCreateAlert(item);
      }
    }

    const alerts = await StockAlert.find({
      type: 'Low Stock',
      resolved: false
    })
      .populate('item', 'name sku quantity reorderLevel')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alerts',
      error: error.message
    });
  }
};

/**
 * Get expiry alerts
 */
const getExpiryAlerts = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const items = await InventoryItem.find({
      expiryDate: { $lte: thirtyDaysFromNow, $ne: null },
      quantity: { $gt: 0 },
      status: 'Active'
    })
      .populate('category', 'name')
      .populate('location', 'name')
      .sort({ expiryDate: 1 });

    const alerts = items.map(item => ({
      item,
      daysUntilExpiry: Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
      status: item.expiryDate < new Date() ? 'Expired' : 'Expiring Soon'
    }));

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Get expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiry alerts',
      error: error.message
    });
  }
};

/**
 * Get inventory reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate inventory reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get inventory reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory reports',
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
 * Get inventory summary
 */
const getInventorySummary = async (req, res) => {
  try {
    const [
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems
    ] = await Promise.all([
      InventoryItem.countDocuments({ status: 'Active' }),
      InventoryItem.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
      ]),
      InventoryItem.countDocuments({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
        status: 'Active'
      }),
      InventoryItem.countDocuments({
        quantity: 0,
        status: 'Active'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalValue: totalValue[0]?.total || 0,
        lowStockItems,
        outOfStockItems,
        healthyStock: totalItems - lowStockItems - outOfStockItems
      }
    });
  } catch (error) {
    logger.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory summary',
      error: error.message
    });
  }
};

/**
 * Get inventory valuation
 */
const getInventoryValuation = async (req, res) => {
  try {
    const items = await InventoryItem.find({ status: 'Active' })
      .populate('category', 'name')
      .select('name sku quantity unitPrice');

    const valuation = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
      items: items.map(item => ({
        ...item.toObject(),
        value: item.quantity * item.unitPrice
      }))
    };

    // Group by category
    const byCategory = {};
    for (const item of items) {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = {
          count: 0,
          value: 0
        };
      }
      byCategory[categoryName].count++;
      byCategory[categoryName].value += item.quantity * item.unitPrice;
    }

    valuation.byCategory = byCategory;

    res.status(200).json({
      success: true,
      data: valuation
    });
  } catch (error) {
    logger.error('Get inventory valuation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory valuation',
      error: error.message
    });
  }
};

/**
 * Get inventory stats
 */
const getInventoryStats = async (req, res) => {
  try {
    const [
      totalItems,
      totalQuantity,
      lowStock,
      outOfStock,
      totalCategories,
      totalLocations
    ] = await Promise.all([
      InventoryItem.countDocuments({ status: 'Active' }),
      InventoryItem.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      InventoryItem.countDocuments({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
        status: 'Active'
      }),
      InventoryItem.countDocuments({ quantity: 0, status: 'Active' }),
      InventoryCategory.countDocuments({ isActive: true }),
      InventoryLocation.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalQuantity: totalQuantity[0]?.total || 0,
        lowStock,
        outOfStock,
        totalCategories,
        totalLocations,
        healthScore: totalItems > 0 ? Math.round(((totalItems - lowStock - outOfStock) / totalItems) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory stats',
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
      movementsToday,
      addedToday,
      removedToday
    ] = await Promise.all([
      StockMovement.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      StockMovement.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        type: 'Add'
      }),
      StockMovement.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        type: 'Remove'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        movementsToday,
        addedToday,
        removedToday
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
      movementsMonth,
      addedMonth,
      removedMonth
    ] = await Promise.all([
      StockMovement.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth } }),
      StockMovement.countDocuments({
        date: { $gte: startOfMonth, $lt: endOfMonth },
        type: 'Add'
      }),
      StockMovement.countDocuments({
        date: { $gte: startOfMonth, $lt: endOfMonth },
        type: 'Remove'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        movementsMonth,
        addedMonth,
        removedMonth
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
 * Helper: Check and create alert
 */
const checkAndCreateAlert = async (item) => {
  try {
    const existingAlert = await StockAlert.findOne({
      item: item._id,
      resolved: false
    });

    if (!existingAlert) {
      const alert = new StockAlert({
        item: item._id,
        type: item.quantity === 0 ? 'Out of Stock' : 'Low Stock',
        threshold: item.reorderLevel,
        message: item.quantity === 0 
          ? `${item.name} is out of stock` 
          : `${item.name} is running low on stock (${item.quantity} remaining)`,
        createdBy: null,
        resolved: false
      });
      await alert.save();
    }
  } catch (error) {
    logger.error('Check and create alert error:', error);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
  getItemsByCategory,
  getLowStockItems,
  getOutOfStockItems,
  getStockLevels,
  updateStockLevel,
  adjustStock,
  transferStock,
  getStockMovements,
  getStockHistory,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getAlerts,
  createAlert,
  updateAlert,
  resolveAlert,
  getLowStockAlerts,
  getExpiryAlerts,
  getReports,
  generateReport,
  getInventorySummary,
  getInventoryValuation,
  getInventoryStats,
  getDailyStats,
  getMonthlyStats
};
