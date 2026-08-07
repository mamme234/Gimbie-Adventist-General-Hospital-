/**
 * ============================================
 * DOCTOR.CONTROLLER.JS - Doctor Controller
 * ============================================
 */

const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const Prescription = require('../models/Prescription');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all doctors
 */
const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, specialty, department, isAvailable } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (specialty) query.specialty = { $regex: specialty, $options: 'i' };
    if (department) query.department = department;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('department', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await Doctor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
};

/**
 * Get doctor by ID
 */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('department', 'name code location');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    logger.error('Get doctor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor',
      error: error.message
    });
  }
};

/**
 * Get my profile (Doctor)
 */
const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phone profileImage')
      .populate('department', 'name code location');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
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
 * Create doctor (Admin only)
 */
const createDoctor = async (req, res) => {
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
      specialty,
      department,
      licenseNumber,
      yearsOfExperience,
      education,
      certifications,
      consultationFee,
      consultationDuration,
      languages,
      availability,
      bio,
      achievements
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: tempPassword,
        role: 'doctor'
      });
      await user.save();
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ userId: user._id });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'Doctor already exists for this user'
      });
    }

    const doctorId = `DOC-${new Date().getFullYear()}-${String(await Doctor.countDocuments() + 1).padStart(4, '0')}`;

    const doctor = new Doctor({
      userId: user._id,
      doctorId,
      specialty,
      department,
      licenseNumber,
      yearsOfExperience: yearsOfExperience || 0,
      education,
      certifications,
      consultationFee: consultationFee || 0,
      consultationDuration: consultationDuration || 30,
      languages: languages || ['English'],
      availability,
      bio,
      achievements,
      isAvailable: true
    });

    await doctor.save();

    logger.info(`Doctor created: ${doctor.doctorId}`);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    logger.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor',
      error: error.message
    });
  }
};

/**
 * Update doctor
 */
const updateDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const {
      specialty,
      department,
      licenseNumber,
      yearsOfExperience,
      education,
      certifications,
      consultationFee,
      consultationDuration,
      languages,
      availability,
      isAvailable,
      bio,
      achievements
    } = req.body;

    if (specialty) doctor.specialty = specialty;
    if (department) doctor.department = department;
    if (licenseNumber) doctor.licenseNumber = licenseNumber;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = yearsOfExperience;
    if (education) doctor.education = education;
    if (certifications) doctor.certifications = certifications;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (consultationDuration !== undefined) doctor.consultationDuration = consultationDuration;
    if (languages) doctor.languages = languages;
    if (availability) doctor.availability = availability;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;
    if (bio) doctor.bio = bio;
    if (achievements) doctor.achievements = achievements;

    await doctor.save();

    logger.info(`Doctor updated: ${doctor.doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    logger.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
};

/**
 * Delete doctor (Admin only)
 */
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.isAvailable = false;
    await doctor.save();

    logger.info(`Doctor deactivated: ${doctor.doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Doctor deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
};

/**
 * Get doctor's patients
 */
const getPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const patients = await Patient.find({ assignedDoctor: doctor._id })
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedNurse', 'nurseId');

    res.status(200).json({
      success: true,
      data: patients
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
 * Get doctor's appointments
 */
const getAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const { status, date } = req.query;
    let query = { doctor: doctor._id };

    if (status) query.status = status;
    if (date) query.date = new Date(date);

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId')
      .populate('department', 'name code')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: appointments
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
 * Get doctor's schedule
 */
const getSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const { week } = req.query;
    const startDate = week ? new Date(week) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: startDate, $lt: endDate },
      status: { $nin: ['Cancelled'] }
    }).sort({ date: 1, time: 1 });

    const schedule = {
      doctor: {
        id: doctor._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        specialty: doctor.specialty
      },
      availability: doctor.availability,
      appointments: appointments,
      weekStart: startDate,
      weekEnd: endDate
    };

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule',
      error: error.message
    });
  }
};

/**
 * Update doctor availability
 */
const updateAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const { availability } = req.body;
    doctor.availability = availability;
    await doctor.save();

    logger.info(`Availability updated for doctor: ${doctor.doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: doctor.availability
    });
  } catch (error) {
    logger.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};

/**
 * Get today's appointments
 */
const getTodayAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Cancelled'] }
    }).sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today appointments',
      error: error.message
    });
  }
};

/**
 * Get upcoming appointments
 */
const getUpcomingAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: today },
      status: { $in: ['Confirmed', 'Pending'] }
    }).sort({ date: 1, time: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming appointments',
      error: error.message
    });
  }
};

/**
 * Get patient history
 */
const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const patient = await Patient.findOne({ patientId })
      .populate('userId', 'firstName lastName email phone');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointments = await Appointment.find({
      patient: patient._id,
      doctor: doctor._id
    }).sort({ date: -1 });

    const prescriptions = await Prescription.find({
      patient: patient._id,
      doctor: doctor._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        patient,
        appointments,
        prescriptions,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        medications: patient.medications
      }
    });
  } catch (error) {
    logger.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient history',
      error: error.message
    });
  }
};

/**
 * Add diagnosis
 */
const addDiagnosis = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const { patientId, diagnosis, notes } = req.body;

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Find the latest appointment
    const appointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctor._id,
      status: { $in: ['In Progress', 'Completed'] }
    }).sort({ date: -1 });

    if (appointment) {
      appointment.diagnosis = diagnosis;
      appointment.notes = notes || appointment.notes;
      await appointment.save();
    }

    // Add to patient's medical history
    patient.medicalHistory.push({
      condition: diagnosis,
      diagnosedDate: new Date(),
      status: 'Active',
      notes
    });

    await patient.save();

    logger.info(`Diagnosis added for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Diagnosis added successfully',
      data: { diagnosis, patient: patient.patientId }
    });
  } catch (error) {
    logger.error('Add diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add diagnosis',
      error: error.message
    });
  }
};

/**
 * Get diagnoses
 */
const getDiagnoses = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const diagnoses = await Appointment.find({
      doctor: doctor._id,
      diagnosis: { $exists: true, $ne: null }
    }).populate('patient', 'patientId')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: diagnoses
    });
  } catch (error) {
    logger.error('Get diagnoses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnoses',
      error: error.message
    });
  }
};

/**
 * Get prescriptions
 */
const getPrescriptions = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const prescriptions = await Prescription.find({
      doctor: doctor._id
    }).populate('patient', 'patientId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions
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
 * Get lab orders
 */
const getLabOrders = async (req, res) => {
  try {
    // Placeholder - would query LabOrder model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get lab orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lab orders',
      error: error.message
    });
  }
};

/**
 * Get radiology orders
 */
const getRadiologyOrders = async (req, res) => {
  try {
    // Placeholder - would query RadiologyOrder model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get radiology orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get radiology orders',
      error: error.message
    });
  }
};

/**
 * Get surgery schedule
 */
const getSurgerySchedule = async (req, res) => {
  try {
    // Placeholder - would query Surgery model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get surgery schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surgery schedule',
      error: error.message
    });
  }
};

/**
 * Get referrals
 */
const getReferrals = async (req, res) => {
  try {
    // Placeholder - would query Referral model
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referrals',
      error: error.message
    });
  }
};

/**
 * Create referral
 */
const createReferral = async (req, res) => {
  try {
    // Placeholder - would create Referral
    res.status(201).json({
      success: true,
      message: 'Referral created successfully'
    });
  } catch (error) {
    logger.error('Create referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create referral',
      error: error.message
    });
  }
};

/**
 * Update referral
 */
const updateReferral = async (req, res) => {
  try {
    // Placeholder - would update Referral
    res.status(200).json({
      success: true,
      message: 'Referral updated successfully'
    });
  } catch (error) {
    logger.error('Update referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update referral',
      error: error.message
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getMyProfile,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPatients,
  getAppointments,
  getSchedule,
  updateAvailability,
  getTodayAppointments,
  getUpcomingAppointments,
  getPatientHistory,
  addDiagnosis,
  getDiagnoses,
  getPrescriptions,
  getLabOrders,
  getRadiologyOrders,
  getSurgerySchedule,
  getReferrals,
  createReferral,
  updateReferral
};
