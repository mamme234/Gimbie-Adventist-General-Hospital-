// sockets/appointment.socket.js
const { logger } = require('../utils/logger');
const { Appointment } = require('../models/Appointment');

class AppointmentSocketHandler {
  constructor(socketServer) {
    this.socketServer = socketServer;
  }

  init(socket) {
    this.socket = socket;
    this.userId = socket.userId;

    // Register events
    socket.on('appointment:join', this.handleJoin.bind(this));
    socket.on('appointment:leave', this.handleLeave.bind(this));
    socket.on('appointment:update', this.handleUpdate.bind(this));
    socket.on('appointment:cancel', this.handleCancel.bind(this));
    socket.on('appointment:confirm', this.handleConfirm.bind(this));
  }

  async handleJoin(data) {
    try {
      const { appointmentId } = data;

      this.socket.join(`appointment:${appointmentId}`);
      
      this.socket.to(`appointment:${appointmentId}`).emit('appointment:participant-joined', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:joined', { appointmentId });
    } catch (error) {
      logger.error('Join appointment error:', error);
    }
  }

  async handleLeave(data) {
    try {
      const { appointmentId } = data;

      this.socket.leave(`appointment:${appointmentId}`);
      
      this.socket.to(`appointment:${appointmentId}`).emit('appointment:participant-left', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:left', { appointmentId });
    } catch (error) {
      logger.error('Leave appointment error:', error);
    }
  }

  async handleUpdate(data) {
    try {
      const { appointmentId, updates } = data;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', { message: 'Appointment not found' });
      }

      Object.assign(appointment, updates);
      appointment.updatedAt = new Date();
      await appointment.save();

      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:updated', {
        appointment,
        updatedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:updated', { appointment });
    } catch (error) {
      logger.error('Update appointment error:', error);
      this.socket.emit('appointment:error', { message: error.message });
    }
  }

  async handleCancel(data) {
    try {
      const { appointmentId, reason } = data;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', { message: 'Appointment not found' });
      }

      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = this.userId;
      appointment.cancellationReason = reason || 'Cancelled by user';
      await appointment.save();

      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:cancelled', {
        appointment,
        cancelledBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:cancelled', { appointment });
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      this.socket.emit('appointment:error', { message: error.message });
    }
  }

  async handleConfirm(data) {
    try {
      const { appointmentId } = data;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return this.socket.emit('appointment:error', { message: 'Appointment not found' });
      }

      appointment.status = 'confirmed';
      appointment.confirmedAt = new Date();
      appointment.confirmedBy = this.userId;
      await appointment.save();

      this.socketServer.sendToRoom(`appointment:${appointmentId}`, 'appointment:confirmed', {
        appointment,
        confirmedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('appointment:confirmed', { appointment });
    } catch (error) {
      logger.error('Confirm appointment error:', error);
      this.socket.emit('appointment:error', { message: error.message });
    }
  }
}

module.exports = AppointmentSocketHandler;
