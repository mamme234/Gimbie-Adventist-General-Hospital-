// sockets/appointment.socket.js
const { logger } = require('../utils/logger');
const { Appointment } = require('../models/Appointment');
const { Employee } = require('../models/Employee');
const notificationService = require('../services/notification.service');

class AppointmentSocketHandler {
  constructor() {
    this.socketServer = null;
    this.socket = null;
    this.userId = null;
    this.activeAppointments = new Set();
  }

  // Initialize appointment socket handler
  init(socketServer, socket) {
    this.socketServer = socketServer;
    this.socket = socket;
    this.userId = socket.userId;

    // Register event handlers
    this.registerEvents();

    // Load active appointments
    this.loadActiveAppointments();
  }

  // Register appointment events
  registerEvents() {
    const socket = this.socket;

    // Create appointment
    socket.on('appointment:create', this.handleCreateAppointment.bind(this));

    // Get appointments
    socket.on('appointment:get', this.handleGetAppointments.bind(this));

    // Update appointment
    socket.on('appointment:update', this.handleUpdateAppointment.bind(this));

    // Cancel appointment
    socket.on('appointment:cancel', this.handleCancelAppointment.bind(this));

    // Confirm appointment
    socket.on('appointment:confirm', this.handleConfirmAppointment.bind(this));

    // Reschedule appointment
    socket.on('appointment:reschedule', this.handleRescheduleAppointment.bind(this));

    // Get appointment details
    socket.on('appointment:details', this.handleGetAppointmentDetails.bind(this));

    // Get appointment slots
    socket.on('appointment:slots', this.handleGetSlots.bind(this));

    // Join appointment room
    socket.on('appointment:join', this.handleJoinAppointment.bind(this));

    // Leave appointment room
    socket.on('appointment:leave', this.handleLeaveAppointment.bind(this));

    // Send appointment reminder
    socket.on('appointment:reminder', this.handleSendReminder.bind(this));
  }

  // Handle create appointment
  async handleCreateAppointment(data) {
    try {
      const {
        patientId,
        doctorId,
        date,
        time,
        duration,
        type,
        notes,
        priority
      } = data;

      // Validate
      if (!patientId || !doctorId || !date || !time) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_FIELDS',
          message: 'Required fields are missing'
        });
      }

      // Check availability
      const isAvailable = await this.checkAvailability(doctorId, date, time);
      if (!isAvailable) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_AVAILABLE',
          message: 'The selected time slot is not available'
        });
      }

      // Create appointment
      const appointment = new Appointment({
        patientId,
        doctorId,
        date: new Date(date),
        time,
        duration: duration || 30,
        type: type || 'consultation',
        notes,
        priority: priority || 'normal',
        status: 'scheduled',
        createdBy: this.userId,
        createdAt: new Date()
      });

      await appointment.save();

      // Join appointment room
      this.socket.join(`appointment:${appointment._id}`);
      this.activeAppointments.add(appointment._id.toString());

      // Notify doctor
      this.socketServer.sendToUser(doctorId, 'appointment:new', {
        appointment,
        patient: {
          id: this.socket.user._id,
          name: `${this.socket.user.firstName} ${this.socket.user.lastName}`
        },
        timestamp: new Date()
      });

      // Send confirmation
      this.socket.emit('appointment:created', {
        appointment,
        timestamp: new Date()
      });

      // Send notification
      await this.sendAppointmentNotification(appointment, 'created');

      logger.info(`Appointment created by user ${this.userId}`);
    } catch (error) {
      logger.error('Create appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'CREATE_ERROR',
        message: error.message || 'Failed to create appointment'
      });
    }
  }

  // Handle get appointments
  async handleGetAppointments(data) {
    try {
      const { status, startDate, endDate, role, page, limit } = data || {};

      const query = {};

      // Filter by role
      if (role === 'patient') {
        query.patientId = this.userId;
      } else if (role === 'doctor') {
        query.doctorId = this.userId;
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const appointments = await Appointment.find(query)
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName email phone')
        .sort({ date: 1, time: 1 })
        .skip(((page || 1) - 1) * (limit || 20))
        .limit(limit || 20)
        .lean();

      const total = await Appointment.countDocuments(query);

      this.socket.emit('appointment:list', {
        appointments,
        total,
        page: page || 1,
        limit: limit || 20
      });
    } catch (error) {
      logger.error('Get appointments error:', error);
      this.socket.emit('appointment:error', {
        code: 'GET_ERROR',
        message: error.message || 'Failed to get appointments'
      });
    }
  }

  // Handle update appointment
  async handleUpdateAppointment(data) {
    try {
      const { appointmentId, updates } = data;

      if (!appointmentId || !updates) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_FIELDS',
          message: 'Appointment ID and updates are required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      // Check permissions
      if (!this.canModifyAppointment(appointment)) {
        return this.socket.emit('appointment:error', {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to modify this appointment'
        });
      }

      // Update fields
      Object.assign(appointment, updates);
      appointment.updatedAt = new Date();
      appointment.updatedBy = this.userId;

      await appointment.save();

      // Notify participants
      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:updated', {
        appointment,
        updatedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:updated', {
        appointment,
        timestamp: new Date()
      });

      // Send notification
      await this.sendAppointmentNotification(appointment, 'updated');

      logger.info(`Appointment ${appointmentId} updated by user ${this.userId}`);
    } catch (error) {
      logger.error('Update appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'UPDATE_ERROR',
        message: error.message || 'Failed to update appointment'
      });
    }
  }

  // Handle cancel appointment
  async handleCancelAppointment(data) {
    try {
      const { appointmentId, reason } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      // Check permissions
      if (!this.canModifyAppointment(appointment)) {
        return this.socket.emit('appointment:error', {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to cancel this appointment'
        });
      }

      appointment.status = 'cancelled';
      appointment.cancellationReason = reason || 'Cancelled by patient';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = this.userId;
      await appointment.save();

      // Notify participants
      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:cancelled', {
        appointmentId,
        reason: appointment.cancellationReason,
        cancelledBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:cancelled', {
        appointment,
        timestamp: new Date()
      });

      // Send notification
      await this.sendAppointmentNotification(appointment, 'cancelled');

      // Leave appointment room
      this.socket.leave(`appointment:${appointmentId}`);
      this.activeAppointments.delete(appointmentId);

      logger.info(`Appointment ${appointmentId} cancelled by user ${this.userId}`);
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'CANCEL_ERROR',
        message: error.message || 'Failed to cancel appointment'
      });
    }
  }

  // Handle confirm appointment
  async handleConfirmAppointment(data) {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      // Check permissions
      if (!this.canModifyAppointment(appointment)) {
        return this.socket.emit('appointment:error', {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to confirm this appointment'
        });
      }

      appointment.status = 'confirmed';
      appointment.confirmedAt = new Date();
      appointment.confirmedBy = this.userId;
      await appointment.save();

      // Notify participants
      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:confirmed', {
        appointmentId,
        confirmedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:confirmed', {
        appointment,
        timestamp: new Date()
      });

      // Send notification
      await this.sendAppointmentNotification(appointment, 'confirmed');

      logger.info(`Appointment ${appointmentId} confirmed by user ${this.userId}`);
    } catch (error) {
      logger.error('Confirm appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'CONFIRM_ERROR',
        message: error.message || 'Failed to confirm appointment'
      });
    }
  }

  // Handle reschedule appointment
  async handleRescheduleAppointment(data) {
    try {
      const { appointmentId, newDate, newTime } = data;

      if (!appointmentId || !newDate || !newTime) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_FIELDS',
          message: 'Appointment ID, new date, and new time are required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      // Check permissions
      if (!this.canModifyAppointment(appointment)) {
        return this.socket.emit('appointment:error', {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to reschedule this appointment'
        });
      }

      // Check availability
      const isAvailable = await this.checkAvailability(
        appointment.doctorId,
        newDate,
        newTime
      );
      if (!isAvailable) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_AVAILABLE',
          message: 'The selected time slot is not available'
        });
      }

      const oldDate = appointment.date;
      const oldTime = appointment.time;

      appointment.date = new Date(newDate);
      appointment.time = newTime;
      appointment.status = 'rescheduled';
      appointment.rescheduledAt = new Date();
      appointment.rescheduledBy = this.userId;
      await appointment.save();

      // Notify participants
      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:rescheduled', {
        appointment,
        oldDate,
        oldTime,
        rescheduledBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:rescheduled', {
        appointment,
        oldDate,
        oldTime,
        timestamp: new Date()
      });

      // Send notification
      await this.sendAppointmentNotification(appointment, 'rescheduled');

      logger.info(`Appointment ${appointmentId} rescheduled by user ${this.userId}`);
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'RESCHEDULE_ERROR',
        message: error.message || 'Failed to reschedule appointment'
      });
    }
  }

  // Handle get appointment details
  async handleGetAppointmentDetails(data) {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'firstName lastName email phone')
        .populate('doctorId', 'firstName lastName email phone')
        .lean();

      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      this.socket.emit('appointment:details', appointment);
    } catch (error) {
      logger.error('Get appointment details error:', error);
      this.socket.emit('appointment:error', {
        code: 'DETAILS_ERROR',
        message: error.message || 'Failed to get appointment details'
      });
    }
  }

  // Handle get slots
  async handleGetSlots(data) {
    try {
      const { doctorId, date, duration } = data;

      if (!doctorId || !date) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_FIELDS',
          message: 'Doctor ID and date are required'
        });
      }

      const slots = await this.getAvailableSlots(
        doctorId,
        new Date(date),
        duration || 30
      );

      this.socket.emit('appointment:slots', {
        doctorId,
        date,
        slots,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Get slots error:', error);
      this.socket.emit('appointment:error', {
        code: 'SLOTS_ERROR',
        message: error.message || 'Failed to get available slots'
      });
    }
  }

  // Handle join appointment
  async handleJoinAppointment(data) {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      // Check if user is authorized
      if (!this.canAccessAppointment(appointment)) {
        return this.socket.emit('appointment:error', {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to access this appointment'
        });
      }

      // Join room
      this.socket.join(`appointment:${appointmentId}`);
      this.activeAppointments.add(appointmentId);

      // Notify others
      this.socket.to(`appointment:${appointmentId}`).emit('appointment:participant-joined', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:joined', {
        appointmentId,
        timestamp: new Date()
      });

      logger.debug(`User ${this.userId} joined appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Join appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'JOIN_ERROR',
        message: error.message || 'Failed to join appointment'
      });
    }
  }

  // Handle leave appointment
  async handleLeaveAppointment(data) {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      // Leave room
      this.socket.leave(`appointment:${appointmentId}`);
      this.activeAppointments.delete(appointmentId);

      // Notify others
      this.socket.to(`appointment:${appointmentId}`).emit('appointment:participant-left', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:left', {
        appointmentId,
        timestamp: new Date()
      });

      logger.debug(`User ${this.userId} left appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Leave appointment error:', error);
      this.socket.emit('appointment:error', {
        code: 'LEAVE_ERROR',
        message: error.message || 'Failed to leave appointment'
      });
    }
  }

  // Handle send reminder
  async handleSendReminder(data) {
    try {
      const { appointmentId } = data;

      if (!appointmentId) {
        return this.socket.emit('appointment:error', {
          code: 'MISSING_ID',
          message: 'Appointment ID is required'
        });
      }

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', {
          code: 'NOT_FOUND',
          message: 'Appointment not found'
        });
      }

      await this.sendAppointmentReminder(appointment);

      this.socket.emit('appointment:reminder-sent', {
        appointmentId,
        timestamp: new Date()
      });

      logger.info(`Reminder sent for appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Send reminder error:', error);
      this.socket.emit('appointment:error', {
        code: 'REMINDER_ERROR',
        message: error.message || 'Failed to send reminder'
      });
    }
  }

  // Check availability
  async checkAvailability(doctorId, date, time) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await Appointment.findOne({
        doctorId,
        date: { $gte: startOfDay, $lte: endOfDay },
        time,
        status: { $nin: ['cancelled', 'completed'] }
      });

      return !existing;
    } catch (error) {
      logger.error('Check availability error:', error);
      return false;
    }
  }

  // Get available slots
  async getAvailableSlots(doctorId, date, duration) {
    try {
      const slots = [];
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM

      // Get doctor's working hours (would come from settings)
      const workingHours = {
        start: 9,
        end: 17
      };

      const startTime = workingHours.start;
      const endTime = workingHours.end;

      // Get booked appointments
      const booked = await Appointment.find({
        doctorId,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { $nin: ['cancelled', 'completed'] }
      });

      const bookedTimes = new Set(booked.map(a => a.time));

      // Generate slots
      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += duration) {
          const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          if (!bookedTimes.has(time)) {
            slots.push(time);
          }
        }
      }

      return slots;
    } catch (error) {
      logger.error('Get available slots error:', error);
      return [];
    }
  }

  // Check if user can modify appointment
  canModifyAppointment(appointment) {
    const userId = this.userId;
    const userRole = this.socket.user.role;

    // Admin can modify any appointment
    if (userRole === 'admin') return true;

    // Patient can modify their own appointments
    if (appointment.patientId.toString() === userId) return true;

    // Doctor can modify their own appointments
    if (appointment.doctorId.toString() === userId) return true;

    return false;
  }

  // Check if user can access appointment
  canAccessAppointment(appointment) {
    const userId = this.userId;
    const userRole = this.socket.user.role;

    // Admin can access any appointment
    if (userRole === 'admin') return true;

    // Patient can access their own appointments
    if (appointment.patientId.toString() === userId) return true;

    // Doctor can access their own appointments
    if (appointment.doctorId.toString() === userId) return true;

    return false;
  }

  // Send appointment notification
  async sendAppointmentNotification(appointment, action) {
    try {
      const patient = await Employee.findById(appointment.patientId);
      const doctor = await Employee.findById(appointment.doctorId);

      const message = this.getNotificationMessage(action, appointment, patient, doctor);

      // Notify patient
      await notificationService.sendNotification({
        userId: appointment.patientId,
        type: 'appointment',
        title: message.title,
        body: message.patientBody || message.body,
        priority: 'medium',
        channels: ['in-app', 'push'],
        data: {
          appointmentId: appointment._id,
          action: 'view_appointment'
        }
      });

      // Notify doctor
      await notificationService.sendNotification({
        userId: appointment.doctorId,
        type: 'appointment',
        title: message.title,
        body: message.doctorBody || message.body,
        priority: 'medium',
        channels: ['in-app', 'push'],
        data: {
          appointmentId: appointment._id,
          action: 'view_appointment'
        }
      });
    } catch (error) {
      logger.error('Send appointment notification error:', error);
    }
  }

  // Get notification message
  getNotificationMessage(action, appointment, patient, doctor) {
    const messages = {
      created: {
        title: 'New Appointment',
        body: `Appointment scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        patientBody: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        doctorBody: `New appointment with ${patient.firstName} ${patient.lastName} scheduled for ${appointment.date.toLocaleDateString()} at ${appointment.time}`
      },
      updated: {
        title: 'Appointment Updated',
        body: `Appointment details have been updated`,
        patientBody: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been updated`,
        doctorBody: `Appointment with ${patient.firstName} ${patient.lastName} has been updated`
      },
      confirmed: {
        title: 'Appointment Confirmed',
        body: `Appointment confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        patientBody: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        doctorBody: `Appointment with ${patient.firstName} ${patient.lastName} has been confirmed for ${appointment.date.toLocaleDateString()} at ${appointment.time}`
      },
      cancelled: {
        title: 'Appointment Cancelled',
        body: `Appointment has been cancelled`,
        patientBody: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been cancelled`,
        doctorBody: `Appointment with ${patient.firstName} ${patient.lastName} has been cancelled`
      },
      rescheduled: {
        title: 'Appointment Rescheduled',
        body: `Appointment rescheduled to ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        patientBody: `Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} has been rescheduled to ${appointment.date.toLocaleDateString()} at ${appointment.time}`,
        doctorBody: `Appointment with ${patient.firstName} ${patient.lastName} has been rescheduled to ${appointment.date.toLocaleDateString()} at ${appointment.time}`
      }
    };

    return messages[action] || messages.created;
  }

  // Send appointment reminder
  async sendAppointmentReminder(appointment) {
    try {
      const patient = await Employee.findById(appointment.patientId);
      const doctor = await Employee.findById(appointment.doctorId);

      // Send to patient
      await notificationService.sendNotification({
        userId: appointment.patientId,
        type: 'appointment',
        title: 'Appointment Reminder',
        body: `Reminder: Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is tomorrow at ${appointment.time}`,
        priority: 'high',
        channels: ['in-app', 'push', 'sms'],
        data: {
          appointmentId: appointment._id,
          action: 'view_appointment'
        }
      });

      // Send to doctor
      await notificationService.sendNotification({
        userId: appointment.doctorId,
        type: 'appointment',
        title: 'Appointment Reminder',
        body: `Reminder: Appointment with ${patient.firstName} ${patient.lastName} tomorrow at ${appointment.time}`,
        priority: 'medium',
        channels: ['in-app', 'push'],
        data: {
          appointmentId: appointment._id,
          action: 'view_appointment'
        }
      });
    } catch (error) {
      logger.error('Send appointment reminder error:', error);
    }
  }

  // Load active appointments
  async loadActiveAppointments() {
    try {
      const appointments = await Appointment.find({
        $or: [
          { patientId: this.userId },
          { doctorId: this.userId }
        ],
        status: { $in: ['scheduled', 'confirmed'] },
        date: { $gte: new Date() }
      });

      for (const appointment of appointments) {
        this.socket.join(`appointment:${appointment._id}`);
        this.activeAppointments.add(appointment._id.toString());
      }

      logger.debug(`Loaded ${appointments.length} active appointments for user ${this.userId}`);
    } catch (error) {
      logger.error('Load active appointments error:', error);
    }
  }

  // Cleanup
  cleanup() {
    for (const appointmentId of this.activeAppointments) {
      this.socket.leave(`appointment:${appointmentId}`);
    }
    this.activeAppointments.clear();
  }
}

// Create singleton instance
const appointmentHandler = new AppointmentSocketHandler();

module.exports = appointmentHandler;
