/**
 * ============================================
 * PATIENT.CONTROLLER.JS - Patient Controller
 * ============================================
 */

const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Bill = require('../models/Bill');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all patients (Admin/Doctor/Nurse)
 */
const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, department } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { 'emergencyContact.name': { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedDoctor', 'doctorId specialty')
      .populate('assignedNurse', 'nurseId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message
    });
  }
};

/**
 * Get patient by ID
 */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('assignedDoctor', 'doctorId specialty')
      .populate('assignedNurse', 'nurseId');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    logger.error('Get patient by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient',
      error: error.message
    });
  }
};

/**
 * Get my profile (Patient)
 */
const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phone profileImage preferences')
      .populate('assignedDoctor', 'doctorId specialty')
      .populate('assignedNurse', 'nurseId');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    logger.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Create patient (Admin only)
 */
const createPatient = async (req, res) => {
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      maritalStatus,
      occupation,
      address,
      emergencyContact,
      insurance,
      medicalHistory,
      allergies,
      medications,
      vaccinations,
      status,
      assignedDoctor,
      assignedNurse
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create user
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: tempPassword,
        role: 'patient'
      });
      await user.save();
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ userId: user._id });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient already exists for this user'
      });
    }

    const patientId = `PAT-${new Date().getFullYear()}-${String(await Patient.countDocuments() + 1).padStart(4, '0')}`;

    const patient = new Patient({
      userId: user._id,
      patientId,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodType,
      maritalStatus,
      occupation,
      address,
      emergencyContact,
      insurance,
      medicalHistory,
      allergies,
      medications,
      vaccinations,
      status: status || 'Active',
      assignedDoctor,
      assignedNurse
    });

    await patient.save();

    logger.info(`Patient created: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    logger.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message
    });
  }
};

/**
 * Update patient
 */
const updatePatient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const {
      dateOfBirth,
      gender,
      bloodType,
      maritalStatus,
      occupation,
      address,
      emergencyContact,
      insurance,
      medicalHistory,
      allergies,
      medications,
      vaccinations,
      status,
      assignedDoctor,
      assignedNurse
    } = req.body;

    if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
    if (gender) patient.gender = gender;
    if (bloodType) patient.bloodType = bloodType;
    if (maritalStatus) patient.maritalStatus = maritalStatus;
    if (occupation) patient.occupation = occupation;
    if (address) patient.address = { ...patient.address, ...address };
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    if (insurance) patient.insurance = { ...patient.insurance, ...insurance };
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (allergies) patient.allergies = allergies;
    if (medications) patient.medications = medications;
    if (vaccinations) patient.vaccinations = vaccinations;
    if (status) patient.status = status;
    if (assignedDoctor) patient.assignedDoctor = assignedDoctor;
    if (assignedNurse) patient.assignedNurse = assignedNurse;

    await patient.save();

    logger.info(`Patient updated: ${patient.patientId}`);

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    logger.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};

/**
 * Delete patient (Admin only)
 */
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Soft delete - deactivate instead of delete
    patient.status = 'Inactive';
    await patient.save();

    logger.info(`Patient deactivated: ${patient.patientId}`);

    res.status(200).json({
      success: true,
      message: 'Patient deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message
    });
  }
};

/**
 * Get patient medical records
 */
const getMedicalRecords = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const records = {
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      medications: patient.medications,
      vaccinations: patient.vaccinations,
      vitals: patient.vitals || []
    };

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    logger.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical records',
      error: error.message
    });
  }
};

/**
 * Get patient appointments
 */
const getAppointments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

/**
 * Get patient bills
 */
const getBills = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const bills = await Bill.find({ patient: patient._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    logger.error('Get patient bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bills',
      error: error.message
    });
  }
};

/**
 * Get patient prescriptions
 */
const getPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const prescriptions = await Prescription.find({ patient: patient._id })
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
      message: 'Failed to get prescriptions',
      error: error.message
    });
  }
};

/**
 * Get patient lab results
 */
const getLabResults = async (req, res) => {
  try {
    // Placeholder - would query LabResult model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get lab results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lab results',
      error: error.message
    });
  }
};

/**
 * Get patient radiology results
 */
const getRadiologyResults = async (req, res) => {
  try {
    // Placeholder - would query RadiologyResult model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get radiology results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get radiology results',
      error: error.message
    });
  }
};

/**
 * Get patient vital signs
 */
const getVitalSigns = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient.vitals || []
    });
  } catch (error) {
    logger.error('Get vital signs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vital signs',
      error: error.message
    });
  }
};

/**
 * Add medical record
 */
const addMedicalRecord = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const { condition, diagnosedDate, status, notes } = req.body;

    patient.medicalHistory.push({
      condition,
      diagnosedDate: new Date(diagnosedDate),
      status: status || 'Active',
      notes
    });

    await patient.save();

    logger.info(`Medical record added for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      data: patient.medicalHistory
    });
  } catch (error) {
    logger.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medical record',
      error: error.message
    });
  }
};

/**
 * Add allergy
 */
const addAllergy = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const { allergen, type, severity, reaction, diagnosedDate } = req.body;

    patient.allergies.push({
      allergen,
      type,
      severity,
      reaction,
      diagnosedDate: diagnosedDate ? new Date(diagnosedDate) : new Date()
    });

    await patient.save();

    logger.info(`Allergy added for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Allergy added successfully',
      data: patient.allergies
    });
  } catch (error) {
    logger.error('Add allergy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add allergy',
      error: error.message
    });
  }
};

/**
 * Add medication
 */
const addMedication = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const { name, dosage, frequency, startDate, endDate, prescribedBy, status } = req.body;

    patient.medications.push({
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      prescribedBy,
      status: status || 'Active'
    });

    await patient.save();

    logger.info(`Medication added for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: patient.medications
    });
  } catch (error) {
    logger.error('Add medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message
    });
  }
};

/**
 * Add vaccination
 */
const addVaccination = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const { vaccine, date, administeredBy, nextDueDate } = req.body;

    patient.vaccinations.push({
      vaccine,
      date: new Date(date),
      administeredBy,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : undefined
    });

    await patient.save();

    logger.info(`Vaccination added for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Vaccination added successfully',
      data: patient.vaccinations
    });
  } catch (error) {
    logger.error('Add vaccination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vaccination',
      error: error.message
    });
  }
};

/**
 * Get health summary
 */
const getHealthSummary = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'firstName lastName')
      .populate('assignedDoctor', 'doctorId specialty');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const summary = {
      patientId: patient.patientId,
      name: patient.userId ? `${patient.userId.firstName} ${patient.userId.lastName}` : 'Unknown',
      age: patient.age,
      bloodType: patient.bloodType,
      status: patient.status,
      assignedDoctor: patient.assignedDoctor,
      activeMedications: patient.medications.filter(m => m.status === 'Active'),
      activeAllergies: patient.allergies,
      chronicConditions: patient.medicalHistory.filter(m => m.status === 'Chronic'),
      recentVaccinations: patient.vaccinations.slice(-3)
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get health summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health summary',
      error: error.message
    });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getMyProfile,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalRecords,
  getAppointments,
  getBills,
  getPrescriptions,
  getLabResults,
  getRadiologyResults,
  getVitalSigns,
  addMedicalRecord,
  addAllergy,
  addMedication,
  addVaccination,
  getHealthSummary
};
