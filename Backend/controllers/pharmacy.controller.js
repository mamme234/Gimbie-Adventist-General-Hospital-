/**
 * ============================================
 * PHARMACY.CONTROLLER.JS - Pharmacy Controller
 * ============================================
 */

const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const Inventory = require('../models/PharmacyInventory');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all medicines
 */
const getMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    const medicines = await Medicine.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicines',
      error: error.message
    });
  }
};

/**
 * Get medicine by ID
 */
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    logger.error('Get medicine by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicine',
      error: error.message
    });
  }
};

/**
 * Create medicine (Admin/Pharmacist only)
 */
const createMedicine = async (req, res) => {
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
      genericName,
      category,
      strength,
      form,
      manufacturer,
      unitPrice,
      quantity,
      reorderLevel,
      expiryDate,
      batchNumber,
      description,
      storageConditions,
      sideEffects,
      contraindications,
      status
    } = req.body;

    // Check if medicine exists
    const existingMedicine = await Medicine.findOne({ 
      $and: [{ name }, { strength }, { manufacturer }] 
    });
    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: 'Medicine already exists'
      });
    }

    const medicineId = `MED-${new Date().getFullYear()}-${String(await Medicine.countDocuments() + 1).padStart(4, '0')}`;

    const medicine = new Medicine({
      medicineId,
      name,
      genericName,
      category,
      strength,
      form: form || 'Tablet',
      manufacturer,
      unitPrice,
      quantity: quantity || 0,
      reorderLevel: reorderLevel || 10,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber,
      description,
      storageConditions,
      sideEffects,
      contraindications,
      status: status || 'Active'
    });

    await medicine.save();

    logger.info(`Medicine created: ${medicine.name} (${medicine.medicineId})`);

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error) {
    logger.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: error.message
    });
  }
};

/**
 * Update medicine (Admin/Pharmacist only)
 */
const updateMedicine = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const {
      name,
      genericName,
      category,
      strength,
      form,
      manufacturer,
      unitPrice,
      quantity,
      reorderLevel,
      expiryDate,
      batchNumber,
      description,
      storageConditions,
      sideEffects,
      contraindications,
      status
    } = req.body;

    if (name) medicine.name = name;
    if (genericName) medicine.genericName = genericName;
    if (category) medicine.category = category;
    if (strength) medicine.strength = strength;
    if (form) medicine.form = form;
    if (manufacturer) medicine.manufacturer = manufacturer;
    if (unitPrice !== undefined) medicine.unitPrice = unitPrice;
    if (quantity !== undefined) medicine.quantity = quantity;
    if (reorderLevel !== undefined) medicine.reorderLevel = reorderLevel;
    if (expiryDate) medicine.expiryDate = new Date(expiryDate);
    if (batchNumber) medicine.batchNumber = batchNumber;
    if (description) medicine.description = description;
    if (storageConditions) medicine.storageConditions = storageConditions;
    if (sideEffects) medicine.sideEffects = sideEffects;
    if (contraindications) medicine.contraindications = contraindications;
    if (status) medicine.status = status;

    await medicine.save();

    logger.info(`Medicine updated: ${medicine.name}`);

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    logger.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

/**
 * Delete medicine (Admin only)
 */
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    medicine.status = 'Inactive';
    await medicine.save();

    logger.info(`Medicine deactivated: ${medicine.name}`);

    res.status(200).json({
      success: true,
      message: 'Medicine deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine',
      error: error.message
    });
  }
};

/**
 * Search medicines
 */
const searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ],
      status: 'Active'
    }).limit(20);

    res.status(200).json({
      success: true,
      data: medicines
    });
  } catch (error) {
    logger.error('Search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medicines',
      error: error.message
    });
  }
};

/**
 * Get medicines by category
 */
const getMedicinesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const medicines = await Medicine.find({
      category,
      status: 'Active'
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: medicines
    });
  } catch (error) {
    logger.error('Get medicines by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicines by category',
      error: error.message
    });
  }
};

/**
 * Get low stock medicines
 */
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
      status: 'Active'
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      data: medicines
    });
  } catch (error) {
    logger.error('Get low stock medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock medicines',
      error: error.message
    });
  }
};

/**
 * Get prescriptions
 */
const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);

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
    logger.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions',
      error: error.message
    });
  }
};

/**
 * Get prescription by ID
 */
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty');

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
    logger.error('Get prescription by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescription',
      error: error.message
    });
  }
};

/**
 * Create prescription
 */
const createPrescription = async (req, res) => {
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
      medications,
      diagnosis,
      notes,
      isEmergency
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const prescriptionId = `PRE-${new Date().getFullYear()}-${String(await Prescription.countDocuments() + 1).padStart(4, '0')}`;

    const prescription = new Prescription({
      prescriptionId,
      patient: patientId,
      doctor: req.user._id,
      medications,
      diagnosis,
      notes,
      isEmergency: isEmergency || false,
      status: 'Active',
      issuedDate: new Date()
    });

    // Calculate expiry date (1 year from issue date)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    prescription.expiryDate = expiryDate;

    await prescription.save();

    logger.info(`Prescription created: ${prescription.prescriptionId}`);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

/**
 * Update prescription
 */
const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const { medications, diagnosis, notes, status } = req.body;
    if (medications) prescription.medications = medications;
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (notes) prescription.notes = notes;
    if (status) prescription.status = status;

    await prescription.save();

    logger.info(`Prescription updated: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message
    });
  }
};

/**
 * Delete prescription
 */
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    prescription.status = 'Discontinued';
    await prescription.save();

    logger.info(`Prescription discontinued: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription discontinued successfully'
    });
  } catch (error) {
    logger.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prescription',
      error: error.message
    });
  }
};

/**
 * Get patient prescriptions
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({
      patient: patientId,
      status: { $ne: 'Discontinued' }
    })
      .populate('doctor', 'doctorId specialty')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    logger.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient prescriptions',
      error: error.message
    });
  }
};

/**
 * Get pending prescriptions
 */
const getPendingPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'Pending' })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    logger.error('Get pending prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending prescriptions',
      error: error.message
    });
  }
};

/**
 * Get completed prescriptions
 */
const getCompletedPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ status: 'Completed' })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    logger.error('Get completed prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed prescriptions',
      error: error.message
    });
  }
};

/**
 * Process prescription
 */
const processPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check stock for each medication
    for (const med of prescription.medications) {
      const medicine = await Medicine.findOne({ name: med.name });
      if (medicine) {
        if (medicine.quantity < med.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${med.name}. Available: ${medicine.quantity}`
          });
        }
      }
    }

    // Deduct stock
    for (const med of prescription.medications) {
      const medicine = await Medicine.findOne({ name: med.name });
      if (medicine) {
        medicine.quantity -= med.quantity;
        await medicine.save();
      }
    }

    prescription.status = 'Preparing';
    prescription.processedAt = new Date();
    await prescription.save();

    logger.info(`Prescription processed: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription processed successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Process prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process prescription',
      error: error.message
    });
  }
};

/**
 * Dispense prescription
 */
const dispensePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    prescription.status = 'Dispensed';
    prescription.dispensedAt = new Date();
    prescription.filledBy = req.user._id;
    await prescription.save();

    logger.info(`Prescription dispensed: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: prescription
    });
  } catch (error) {
    logger.error('Dispense prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispense prescription',
      error: error.message
    });
  }
};

/**
 * Cancel prescription
 */
const cancelPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    prescription.status = 'Cancelled';
    await prescription.save();

    logger.info(`Prescription cancelled: ${prescription.prescriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Prescription cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel prescription',
      error: error.message
    });
  }
};

/**
 * Get inventory
 */
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;

    const inventory = await Inventory.find(query)
      .populate('medicine', 'name genericName strength form')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ medicine: 1 });

    const total = await Inventory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: inventory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
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
    const inventory = await Inventory.findById(req.params.id)
      .populate('medicine', 'name genericName strength form unitPrice');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inventory
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
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const { quantity, reorderLevel, location, notes } = req.body;
    if (quantity !== undefined) inventory.quantity = quantity;
    if (reorderLevel !== undefined) inventory.reorderLevel = reorderLevel;
    if (location) inventory.location = location;
    if (notes) inventory.notes = notes;

    await inventory.save();

    logger.info(`Inventory updated: ${inventory._id}`);

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
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
 * Adjust stock
 */
const adjustStock = async (req, res) => {
  try {
    const { itemId, quantity, type, reason } = req.body;

    const inventory = await Inventory.findById(itemId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const adjustment = {
      date: new Date(),
      type,
      quantity,
      reason,
      performedBy: req.user._id
    };

    inventory.stockAdjustments = inventory.stockAdjustments || [];
    inventory.stockAdjustments.push(adjustment);

    if (type === 'Add') {
      inventory.quantity += quantity;
    } else if (type === 'Remove') {
      inventory.quantity -= quantity;
    } else if (type === 'Adjust') {
      inventory.quantity = quantity;
    }

    await inventory.save();

    logger.info(`Stock adjusted for inventory item: ${inventory._id}`);

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: inventory
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
 * Get expiry alerts
 */
const getExpiryAlerts = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringItems = await Inventory.find({
      expiryDate: { $lte: thirtyDaysFromNow },
      quantity: { $gt: 0 }
    }).populate('medicine', 'name genericName strength form');

    const alerts = expiringItems.map(item => ({
      ...item.toObject(),
      daysUntilExpiry: Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
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
 * Get stock movements
 */
const getStockMovements = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.query;

    let query = {};
    if (itemId) query._id = itemId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const inventory = await Inventory.find(query);
    const movements = [];

    for (const item of inventory) {
      if (item.stockAdjustments && item.stockAdjustments.length > 0) {
        for (const adj of item.stockAdjustments) {
          movements.push({
            item: item.medicine,
            date: adj.date,
            type: adj.type,
            quantity: adj.quantity,
            reason: adj.reason,
            performedBy: adj.performedBy
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: movements.sort((a, b) => b.date - a.date)
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
 * Get suppliers
 */
const getSuppliers = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const suppliers = await Supplier.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: suppliers
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

    const { name, contact, phone, email, address, taxId, notes } = req.body;

    const supplier = new Supplier({
      name,
      contact,
      phone,
      email,
      address,
      taxId,
      notes,
      isActive: true
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

    const { name, contact, phone, email, address, taxId, notes, isActive } = req.body;

    if (name) supplier.name = name;
    if (contact) supplier.contact = contact;
    if (phone) supplier.phone = phone;
    if (email) supplier.email = email;
    if (address) supplier.address = address;
    if (taxId) supplier.taxId = taxId;
    if (notes) supplier.notes = notes;
    if (isActive !== undefined) supplier.isActive = isActive;

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

    supplier.isActive = false;
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
      message: 'Failed to delete supplier',
      error: error.message
    });
  }
};

/**
 * Get purchase orders
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, supplierId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (supplierId) query.supplier = supplierId;

    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'name contact')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PurchaseOrder.countDocuments(query);

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
    logger.error('Get purchase orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get purchase orders',
      error: error.message
    });
  }
};

/**
 * Get purchase order by ID
 */
const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name contact phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get purchase order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get purchase order',
      error: error.message
    });
  }
};

/**
 * Create purchase order
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { supplierId, items, expectedDelivery, notes } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const poId = `PO-${new Date().getFullYear()}-${String(await PurchaseOrder.countDocuments() + 1).padStart(4, '0')}`;

    const order = new PurchaseOrder({
      poId,
      supplier: supplierId,
      items,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      notes,
      status: 'Pending',
      orderDate: new Date()
    });

    await order.save();

    logger.info(`Purchase order created: ${order.poId}`);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

/**
 * Update purchase order
 */
const updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    const { items, expectedDelivery, notes, status } = req.body;

    if (items) order.items = items;
    if (expectedDelivery) order.expectedDelivery = new Date(expectedDelivery);
    if (notes) order.notes = notes;
    if (status) order.status = status;

    await order.save();

    logger.info(`Purchase order updated: ${order.poId}`);

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: order
    });
  } catch (error) {
    logger.error('Update purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
};

/**
 * Delete purchase order
 */
const deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    logger.info(`Purchase order cancelled: ${order.poId}`);

    res.status(200).json({
      success: true,
      message: 'Purchase order cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
      error: error.message
    });
  }
};

/**
 * Approve purchase order
 */
const approvePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    order.status = 'Approved';
    order.approvedAt = new Date();
    order.approvedBy = req.user._id;
    await order.save();

    logger.info(`Purchase order approved: ${order.poId}`);

    res.status(200).json({
      success: true,
      message: 'Purchase order approved successfully',
      data: order
    });
  } catch (error) {
    logger.error('Approve purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve purchase order',
      error: error.message
    });
  }
};

/**
 * Receive purchase order
 */
const receivePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    order.status = 'Received';
    order.receivedAt = new Date();
    order.receivedBy = req.user._id;
    await order.save();

    // Update inventory for each item
    for (const item of order.items) {
      const medicine = await Medicine.findOne({ name: item.name });
      if (medicine) {
        medicine.quantity += item.quantity;
        await medicine.save();
      } else {
        // Create new medicine if doesn't exist
        const newMedicine = new Medicine({
          name: item.name,
          strength: item.strength || '',
          form: item.form || 'Tablet',
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity,
          reorderLevel: 10,
          status: 'Active'
        });
        await newMedicine.save();
      }
    }

    logger.info(`Purchase order received: ${order.poId}`);

    res.status(200).json({
      success: true,
      message: 'Purchase order received successfully',
      data: order
    });
  } catch (error) {
    logger.error('Receive purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order',
      error: error.message
    });
  }
};

/**
 * Cancel purchase order
 */
const cancelPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    order.status = 'Cancelled';
    await order.save();

    logger.info(`Purchase order cancelled: ${order.poId}`);

    res.status(200).json({
      success: true,
      message: 'Purchase order cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel purchase order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate pharmacy reports
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
 * Get pharmacy stats
 */
const getPharmacyStats = async (req, res) => {
  try {
    const [
      totalMedicines,
      lowStock,
      outOfStock,
      totalPrescriptions,
      pendingPrescriptions,
      completedPrescriptions
    ] = await Promise.all([
      Medicine.countDocuments({ status: 'Active' }),
      Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
      Medicine.countDocuments({ quantity: 0 }),
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: 'Pending' }),
      Prescription.countDocuments({ status: 'Completed' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        lowStock,
        outOfStock,
        totalPrescriptions,
        pendingPrescriptions,
        completedPrescriptions
      }
    });
  } catch (error) {
    logger.error('Get pharmacy stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pharmacy stats',
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
      prescriptionsToday,
      dispensedToday
    ] = await Promise.all([
      Prescription.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Prescription.countDocuments({ dispensedAt: { $gte: today, $lt: tomorrow } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        prescriptionsToday,
        dispensedToday
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
      prescriptionsMonth,
      dispensedMonth
    ] = await Promise.all([
      Prescription.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      Prescription.countDocuments({ dispensedAt: { $gte: startOfMonth, $lt: endOfMonth } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        prescriptionsMonth,
        dispensedMonth
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

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicinesByCategory,
  getLowStockMedicines,
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getPatientPrescriptions,
  getPendingPrescriptions,
  getCompletedPrescriptions,
  processPrescription,
  dispensePrescription,
  cancelPrescription,
  getInventory,
  getInventoryItem,
  updateInventory,
  adjustStock,
  getExpiryAlerts,
  getStockMovements,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getReports,
  generateReport,
  getPharmacyStats,
  getDailyStats,
  getMonthlyStats
};
