/**
 * ============================================
 * APPOINTMENT.CONTROLLER.JS - Appointment Controller
 * ============================================
 */

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendAppointmentEmail, sendAppointmentReminder } = require('../config/email');
const { smsService } = require('../config/sms');

/**
 * Get all appointments
 */
const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId, date, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (type) query.type = type;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1, time: 1 });

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
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
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
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
      duration,
      type,
      priority,
      symptoms,
      notes,
      departmentId
    } = req.body;

    // Check patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check availability
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      time,
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Generate appointment ID
    const appointmentId = `APT-${new Date().getFullYear()}-${String(await Appointment.countDocuments() + 1).padStart(4, '0')}`;

    const appointment = new Appointment({
      appointmentId,
      patient: patientId,
      doctor: doctorId,
      department: departmentId || doctor.department,
      date: new Date(date),
      time,
      duration: duration || doctor.consultationDuration || 30,
      type: type || 'In-Person',
      priority: priority || 'Normal',
      symptoms,
      notes,
      status: 'Pending'
    });

    await appointment.save();

    // Send confirmation email
    try {
      const patientUser = await User.findById(patient.userId);
      const doctorUser = await User.findById(doctor.userId);
      await sendAppointmentEmail(patientUser.email, {
        patientName: `${patientUser.firstName} ${patientUser.lastName}`,
        doctorName: `${doctorUser.firstName} ${doctorUser.lastName}`,
        date: appointment.date,
        time: appointment.time,
        location: 'Adventist General Hospital'
      });
    } catch (emailError) {
      logger.error('Appointment email error:', emailError);
    }

    // Send SMS if enabled
    try {
      await smsService.sendAppointmentConfirmation(
        patient.user.phone,
        {
          patientName: `${patient.user.firstName} ${patient.user.lastName}`,
          doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
          date: appointment.date,
          time: appointment.time
        }
      );
    } catch (smsError) {
      logger.error('Appointment SMS error:', smsError);
    }

    logger.info(`Appointment created: ${appointment.appointmentId}`);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { date, time, duration, type, priority, status, symptoms, notes } = req.body;

    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (duration) appointment.duration = duration;
    if (type) appointment.type = type;
    if (priority) appointment.priority = priority;
    if (status) appointment.status = status;
    if (symptoms) appointment.symptoms = symptoms;
    if (notes) appointment.notes = notes;

    await appointment.save();

    logger.info(`Appointment updated: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
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
 * Cancel appointment */
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    logger.info(`Appointment cancelled: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
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
 * Complete appointment
 */
const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { diagnosis, notes, prescription } = req.body;

    appointment.status = 'Completed';
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (notes) appointment.notes = notes;
    if (prescription) appointment.prescription = prescription;

    await appointment.save();

    logger.info(`Appointment completed: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment completed successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};

/**
 * Reschedule appointment
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { date, time } = req.body;

    // Check availability
    const existingAppointment = await Appointment.findOne({
      doctor: appointment.doctor,
      date: new Date(date),
      time,
      status: { $nin: ['Cancelled', 'Completed'] },
      _id: { $ne: appointment._id }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    appointment.date = new Date(date);
    appointment.time = time;
    appointment.status = 'Confirmed';
    await appointment.save();

    logger.info(`Appointment rescheduled: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message
    });
  }
};

/**
 * Get available slots
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][appointmentDate.getDay()];
    const dayAvailability = doctor.availability?.[dayOfWeek];

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Generate time slots
    const slots = [];
    const startTime = dayAvailability.start || '09:00';
    const endTime = dayAvailability.end || '17:00';
    const duration = doctor.consultationDuration || 30;

    let current = startTime;
    while (current < endTime) {
      slots.push(current);
      const [hours, minutes] = current.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + duration;
      current = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    }

    // Get booked slots
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: appointmentDate,
      status: { $nin: ['Cancelled', 'Completed'] }
    });

    const bookedTimes = bookedAppointments.map(a => a.time);

    const availableSlots = slots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({
      success: true,
      data: availableSlots
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
 * Get doctor appointments
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date } = req.query;

    let query = { doctor: doctorId };
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId')
      .populate('department', 'name code')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor appointments',
      error: error.message
    });
  }
};

/**
 * Get patient appointments
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    let query = { patient: patientId };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
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
      message: 'Failed to get patient appointments',
      error: error.message
    });
  }
};

/**
 * Get today's appointments
 */
const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Cancelled'] }
    })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code')
      .sort({ time: 1 });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      date: { $gte: today },
      status: { $in: ['Pending', 'Confirmed'] }
    })
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code')
      .sort({ date: 1, time: 1 })
      .limit(20);

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
 * Get appointment stats
 */
const getAppointmentStats = async (req, res) => {
  try {
    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      today
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.countDocuments({ status: 'Confirmed' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
      Appointment.countDocuments({
        date: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        today
      }
    });
  } catch (error) {
    logger.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment stats',
      error: error.message
    });
  }
};

/**
 * Check in appointment
 */
const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'Checked In';
    await appointment.save();

    logger.info(`Appointment checked in: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Patient checked in successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Check in appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in patient',
      error: error.message
    });
  }
};

/**
 * Start appointment
 */
const startAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'In Progress';
    await appointment.save();

    logger.info(`Appointment started: ${appointment.appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment started successfully',
      data: appointment
    });
  } catch (error) {
    logger.error('Start appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start appointment',
      error: error.message
    });
  }
};

/**
 * Get appointment history
 */
const getAppointmentHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({
      patient: patientId,
      status: 'Completed'
    })
      .populate('doctor', 'doctorId specialty')
      .populate('department', 'name code')
      .sort({ date: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('Get appointment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment history',
      error: error.message
    });
  }
};

/**
 * Send appointment reminder
 */
const sendAppointmentReminder = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'userId')
      .populate('doctor', 'userId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const patientUser = await User.findById(appointment.patient.userId);
    const doctorUser = await User.findById(appointment.doctor.userId);

    // Send email reminder
    try {
      await sendAppointmentReminder(patientUser.email, {
        patientName: `${patientUser.firstName} ${patientUser.lastName}`,
        doctorName: `${doctorUser.firstName} ${doctorUser.lastName}`,
        date: appointment.date,
        time: appointment.time,
        location: 'Adventist General Hospital'
      });
    } catch (emailError) {
      logger.error('Reminder email error:', emailError);
    }

    // Send SMS reminder
    try {
      await smsService.sendAppointmentReminder(patientUser.phone, {
        doctorName: `${doctorUser.firstName} ${doctorUser.lastName}`,
        time: appointment.time
      });
    } catch (smsError) {
      logger.error('Reminder SMS error:', smsError);
    }

    appointment.reminders.sent = true;
    appointment.reminders.sentAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    logger.error('Send appointment reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  getDoctorAppointments,
  getPatientAppointments,
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentStats,
  checkInAppointment,
  startAppointment,
  getAppointmentHistory,
  sendAppointmentReminder
};
