// routes/appointments.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { generateAppointmentId, generatePatientId, generateNotificationId } = require('../utils/generateId');

// ============================================
// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
// ============================================
exports.getAppointments = async (req, res) => {
    try {
        const { patient, doctor, date, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (patient) query.patient = patient;
        if (doctor) query.doctor = doctor;
        if (status) query.status = status;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone')
            .populate('doctor', 'userId department')
            .sort({ date: 1, time: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: appointments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
// ============================================
exports.getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient', 'fullName patientId phone')
            .populate('doctor', 'userId department');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Book appointment (Public)
// @route   POST /api/appointments/book
// @access  Public
// ============================================
exports.bookAppointment = async (req, res) => {
    try {
        const { patientName, patientEmail, patientPhone, department, doctor, date, time, type, symptoms } = req.body;

        console.log('Booking appointment for:', patientEmail);

        // Validation
        if (!patientName || !patientEmail || !patientPhone || !department || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Check if patient exists
        let user = await User.findOne({ email: patientEmail.toLowerCase() });
        let patient;

        if (!user) {
            // Create user
            user = await User.create({
                fullName: patientName,
                email: patientEmail.toLowerCase(),
                password: 'Temp123456',
                phone: patientPhone,
                role: 'patient',
                isActive: true
            });

            // Create patient profile
            patient = await Patient.create({
                patientId: generatePatientId(),
                userId: user._id,
                fullName: patientName,
                email: patientEmail,
                phone: patientPhone,
                registeredBy: user._id,
                status: 'Active'
            });

            console.log('New patient created:', patient.patientId);
        } else {
            // Check if patient profile exists
            patient = await Patient.findOne({ userId: user._id });
            if (!patient) {
                patient = await Patient.create({
                    patientId: generatePatientId(),
                    userId: user._id,
                    fullName: patientName,
                    email: patientEmail,
                    phone: patientPhone,
                    registeredBy: user._id,
                    status: 'Active'
                });
            }
        }

        // Find or create a default doctor
        let doctorDoc = await Doctor.findOne({ specialty: department });
        if (!doctorDoc) {
            // Create a default doctor for the department
            doctorDoc = await Doctor.create({
                userId: user._id,
                specialty: department,
                licenseNumber: `LIC-${Date.now()}`,
                department: department,
                isAvailable: true
            });
            console.log('Default doctor created for:', department);
        }

        // Create appointment
        const appointment = await Appointment.create({
            appointmentId: generateAppointmentId(),
            patient: patient._id,
            doctor: doctorDoc._id,
            department: department,
            date: new Date(date),
            time: time,
            type: type || 'Consultation',
            status: 'Scheduled',
            priority: 'Medium',
            symptoms: symptoms ? [symptoms] : [],
            createdBy: user._id
        });

        console.log('Appointment created:', appointment.appointmentId);

        // Create notification
        await Notification.create({
            notificationId: generateNotificationId(),
            recipient: user._id,
            title: 'Appointment Confirmed',
            message: `Your appointment on ${new Date(date).toLocaleDateString()} at ${time} with ${department} department has been confirmed.`,
            type: 'Appointment',
            priority: 'High',
            link: '/pages/patient/dashboard.html'
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: appointment
        });

    } catch (error) {
        console.error('Book appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Create appointment (Logged in)
// @route   POST /api/appointments
// @access  Private
// ============================================
exports.createAppointment = async (req, res) => {
    try {
        const { patient, doctor, date, time, type, symptoms, notes, priority } = req.body;

        // Check if patient exists
        const patientExists = await Patient.findById(patient);
        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Check if doctor exists
        const doctorExists = await Doctor.findById(doctor);
        if (!doctorExists) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        // Check doctor availability
        const isAvailable = doctorExists.isAvailableAt(new Date(date), time);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not available at this time',
            });
        }

        // Check for conflicting appointments
        const conflictingAppointments = await Appointment.countDocuments({
            doctor,
            date: new Date(date),
            time,
            status: { $ne: 'Cancelled' },
        });

        if (conflictingAppointments > 0) {
            return res.status(400).json({
                success: false,
                message: 'Doctor already has an appointment at this time',
            });
        }

        const appointmentData = {
            ...req.body,
            appointmentId: generateAppointmentId(),
            createdBy: req.user.id,
        };

        const appointment = await Appointment.create(appointmentData);

        // Create notification for patient
        await Notification.create({
            notificationId: generateNotificationId(),
            recipient: patientExists.userId || patient,
            title: 'Appointment Scheduled',
            message: `Your appointment with ${doctorExists.userId.fullName} on ${new Date(date).toLocaleDateString()} at ${time} has been scheduled.`,
            type: 'Appointment',
            priority: 'High',
            link: `/appointments/${appointment._id}`,
        });

        res.status(201).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
// ============================================
exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedAppointment,
        });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
// ============================================
exports.cancelAppointment = async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        if (appointment.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Appointment is already cancelled',
            });
        }

        appointment.status = 'Cancelled';
        appointment.cancelledReason = reason || 'Cancelled by user';
        appointment.cancelledBy = req.user.id;
        await appointment.save();

        // Notify patient
        await Notification.create({
            notificationId: generateNotificationId(),
            recipient: appointment.patient,
            title: 'Appointment Cancelled',
            message: `Your appointment on ${appointment.date.toLocaleDateString()} at ${appointment.time} has been cancelled.`,
            type: 'Appointment',
            priority: 'Medium',
        });

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment,
        });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private
// ============================================
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { date, time } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        // Check doctor availability
        const doctor = await Doctor.findById(appointment.doctor);
        const isAvailable = doctor.isAvailableAt(new Date(date), time);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Doctor is not available at this time',
            });
        }

        const oldDate = appointment.date;
        const oldTime = appointment.time;

        appointment.date = new Date(date);
        appointment.time = time;
        appointment.status = 'Rescheduled';
        appointment.rescheduledFrom = appointment._id;
        await appointment.save();

        // Create notification
        await Notification.create({
            notificationId: generateNotificationId(),
            recipient: appointment.patient,
            title: 'Appointment Rescheduled',
            message: `Your appointment has been rescheduled from ${oldDate.toLocaleDateString()} at ${oldTime} to ${new Date(date).toLocaleDateString()} at ${time}.`,
            type: 'Appointment',
            priority: 'High',
            link: `/appointments/${appointment._id}`,
        });

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Reschedule appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Confirm appointment
// @route   PUT /api/appointments/:id/confirm
// @access  Private
// ============================================
exports.confirmAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        appointment.status = 'Confirmed';
        await appointment.save();

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Confirm appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Complete appointment
// @route   PUT /api/appointments/:id/complete
// @access  Private
// ============================================
exports.completeAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        appointment.status = 'Completed';
        await appointment.save();

        // Update doctor stats
        await Doctor.findByIdAndUpdate(appointment.doctor, {
            $inc: { totalPatients: 1, totalAppointments: 1 },
        });

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get doctor availability
// @route   GET /api/appointments/availability/:doctorId
// @access  Private
// ============================================
exports.getDoctorAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        const doctor = await Doctor.findById(req.params.doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const availability = {
            availableDays: doctor.availableDays,
            availableTime: doctor.availableTime,
            breakTime: doctor.breakTime,
            isAvailable: doctor.isAvailable,
        };

        if (date) {
            const appointments = await Appointment.find({
                doctor: req.params.doctorId,
                date: new Date(date),
                status: { $ne: 'Cancelled' },
            });

            availability.bookedSlots = appointments.map(a => a.time);
            availability.availableSlots = [];

            // Generate available time slots
            const start = doctor.availableTime.start;
            const end = doctor.availableTime.end;
            const slotDuration = 30;

            let current = new Date(`2000-01-01 ${start}`);
            const endTime = new Date(`2000-01-01 ${end}`);

            while (current < endTime) {
                const timeString = current.toTimeString().slice(0, 5);
                if (!availability.bookedSlots.includes(timeString)) {
                    availability.availableSlots.push(timeString);
                }
                current.setMinutes(current.getMinutes() + slotDuration);
            }
        }

        res.status(200).json({
            success: true,
            data: availability,
        });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get today's appointments
// @route   GET /api/appointments/today
// @access  Private
// ============================================
exports.getTodayAppointments = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const query = {
            date: { $gte: today, $lt: tomorrow },
            status: { $ne: 'Cancelled' },
        };

        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ userId: req.user.id });
            if (doctor) query.doctor = doctor._id;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone')
            .populate('doctor', 'userId department')
            .sort({ time: 1 });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        console.error('Get today appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get appointment queue
// @route   GET /api/appointments/queue
// @access  Private
// ============================================
exports.getAppointmentQueue = async (req, res) => {
    try {
        const { department, date } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);

        const query = {
            date: { $gte: queryDate, $lt: new Date(queryDate.getTime() + 86400000) },
            status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] },
        };

        if (department) query.department = department;

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone')
            .populate('doctor', 'userId department')
            .sort({ priority: -1, time: 1 });

        // Assign queue numbers
        appointments.forEach((app, index) => {
            app.queueNumber = index + 1;
        });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Update queue status
// @route   PUT /api/appointments/:id/queue
// @access  Private
// ============================================
exports.updateQueueStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        console.error('Update queue error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get patient appointments
// @route   GET /api/appointments/patient/:patientId
// @access  Private
// ============================================
exports.getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            patient: req.params.patientId,
        })
            .populate('doctor', 'userId department')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        console.error('Get patient appointments error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
