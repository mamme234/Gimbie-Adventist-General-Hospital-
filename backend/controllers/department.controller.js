/**
 * ============================================
 * DEPARTMENT.CONTROLLER.JS - Department Controller
 * ============================================
 */

const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all departments
 */
const getDepartments = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const departments = await Department.find(query)
      .populate('headOfDepartment', 'doctorId specialty')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments',
      error: error.message
    });
  }
};

/**
 * Get department by ID
 */
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'doctorId specialty');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    logger.error('Get department by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department',
      error: error.message
    });
  }
};

/**
 * Create department (Admin only)
 */
const createDepartment = async (req, res) => {
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
      code,
      description,
      headOfDepartment,
      location,
      totalBeds,
      availableBeds,
      services,
      equipment,
      staffCount,
      operatingHours
    } = req.body;

    // Check if department exists
    const existingDepartment = await Department.findOne({ $or: [{ name }, { code }] });
    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    const departmentId = `DEPT-${new Date().getFullYear()}-${String(await Department.countDocuments() + 1).padStart(3, '0')}`;

    const department = new Department({
      departmentId,
      name,
      code: code.toUpperCase(),
      description,
      headOfDepartment,
      location,
      totalBeds: totalBeds || 0,
      availableBeds: availableBeds || 0,
      services: services || [],
      equipment: equipment || [],
      staffCount: staffCount || { doctors: 0, nurses: 0, other: 0 },
      operatingHours,
      isActive: true
    });

    await department.save();

    logger.info(`Department created: ${department.name} (${department.code})`);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

/**
 * Update department (Admin only)
 */
const updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const {
      name,
      description,
      headOfDepartment,
      location,
      totalBeds,
      availableBeds,
      services,
      equipment,
      staffCount,
      operatingHours,
      isActive
    } = req.body;

    if (name) department.name = name;
    if (description) department.description = description;
    if (headOfDepartment) department.headOfDepartment = headOfDepartment;
    if (location) department.location = { ...department.location, ...location };
    if (totalBeds !== undefined) department.totalBeds = totalBeds;
    if (availableBeds !== undefined) department.availableBeds = availableBeds;
    if (services) department.services = services;
    if (equipment) department.equipment = equipment;
    if (staffCount) department.staffCount = { ...department.staffCount, ...staffCount };
    if (operatingHours) department.operatingHours = { ...department.operatingHours, ...operatingHours };
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    logger.info(`Department updated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

/**
 * Delete department (Admin only)
 */
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.isActive = false;
    await department.save();

    logger.info(`Department deactivated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};

/**
 * Get department doctors
 */
const getDepartmentDoctors = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const doctors = await Doctor.find({ department: department._id })
      .populate('userId', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    logger.error('Get department doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department doctors',
      error: error.message
    });
  }
};

/**
 * Get department nurses
 */
const getDepartmentNurses = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Placeholder - would query Nurse model with department relation
    const nurses = await Nurse.find({ ward: department.name })
      .populate('userId', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: nurses
    });
  } catch (error) {
    logger.error('Get department nurses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department nurses',
      error: error.message
    });
  }
};

/**
 * Get department stats
 */
const getDepartmentStats = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const doctors = await Doctor.countDocuments({ department: department._id });
    // Placeholder for other stats

    res.status(200).json({
      success: true,
      data: {
        name: department.name,
        totalDoctors: doctors,
        totalBeds: department.totalBeds,
        availableBeds: department.availableBeds,
        occupancy: department.totalBeds > 0 
          ? Math.round(((department.totalBeds - department.availableBeds) / department.totalBeds) * 100)
          : 0
      }
    });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department stats',
      error: error.message
    });
  }
};

/**
 * Get department wards
 */
const getDepartmentWards = async (req, res) => {
  try {
    // Placeholder - would query Ward model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get department wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department wards',
      error: error.message
    });
  }
};

/**
 * Get department beds
 */
const getDepartmentBeds = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total: department.totalBeds || 0,
        available: department.availableBeds || 0,
        occupied: (department.totalBeds || 0) - (department.availableBeds || 0)
      }
    });
  } catch (error) {
    logger.error('Get department beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department beds',
      error: error.message
    });
  }
};

/**
 * Get department equipment
 */
const getDepartmentEquipment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department.equipment || []
    });
  } catch (error) {
    logger.error('Get department equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department equipment',
      error: error.message
    });
  }
};

/**
 * Update department equipment
 */
const updateDepartmentEquipment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.equipment = req.body.equipment;
    await department.save();

    logger.info(`Department equipment updated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: 'Department equipment updated successfully',
      data: department.equipment
    });
  } catch (error) {
    logger.error('Update department equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department equipment',
      error: error.message
    });
  }
};

/**
 * Get department services
 */
const getDepartmentServices = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department.services || []
    });
  } catch (error) {
    logger.error('Get department services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department services',
      error: error.message
    });
  }
};

/**
 * Update department services
 */
const updateDepartmentServices = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.services = req.body.services;
    await department.save();

    logger.info(`Department services updated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: 'Department services updated successfully',
      data: department.services
    });
  } catch (error) {
    logger.error('Update department services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department services',
      error: error.message
    });
  }
};

/**
 * Get department availability
 */
const getDepartmentAvailability = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department.operatingHours || {}
    });
  } catch (error) {
    logger.error('Get department availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department availability',
      error: error.message
    });
  }
};

/**
 * Update department availability
 */
const updateDepartmentAvailability = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.operatingHours = req.body.operatingHours;
    await department.save();

    logger.info(`Department availability updated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: 'Department availability updated successfully',
      data: department.operatingHours
    });
  } catch (error) {
    logger.error('Update department availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department availability',
      error: error.message
    });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentDoctors,
  getDepartmentNurses,
  getDepartmentStats,
  getDepartmentWards,
  getDepartmentBeds,
  getDepartmentEquipment,
  updateDepartmentEquipment,
  getDepartmentServices,
  updateDepartmentServices,
  getDepartmentAvailability,
  updateDepartmentAvailability
};
