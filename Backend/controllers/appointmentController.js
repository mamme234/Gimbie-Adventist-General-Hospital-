// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateAppointmentId, generatePatientId, generateNotificationId } = require('../utils/generateId');

// ============================================
// BOOK APPOINTMENT (PUBLIC)
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
// GET ALL APPOINTMENTS
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
// GET SINGLE APPOINTMENT
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
// CREATE APPOINTMENT (AUTHENTICATED)
// ============================================
exports.createAppointment = async (req, res) => {
    try {
        const { patient, doctor, date, time, type, symptoms, notes, priority } = req.body;

        const patientExists = await Patient.findById(patient);
        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const doctorExists = await Doctor.findById(doctor);
        if (!doctorExists) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const appointmentData = {
            ...req.body,
            appointmentId: generateAppointmentId(),
            createdBy: req.user.id,
        };

        const appointment = await Appointment.create(appointmentData);

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
// UPDATE APPOINTMENT
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
// CANCEL APPOINTMENT
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
// RESCHEDULE APPOINTMENT
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

        const oldDate = appointment.date;
        const oldTime = appointment.time;

        appointment.date = new Date(date);
        appointment.time = time;
        appointment.status = 'Rescheduled';
        await appointment.save();

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
// CONFIRM APPOINTMENT
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
// COMPLETE APPOINTMENT
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
// GET DOCTOR AVAILABILITY
// ============================================
exports.getDoctorAvailability = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                availableDays: doctor.availableDays,
                availableTime: doctor.availableTime,
                isAvailable: doctor.isAvailable,
            },
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
// GET TODAY'S APPOINTMENTS
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
// GET APPOINTMENT QUEUE
// ============================================
exports.getAppointmentQueue = async (req, res) => {
    try {
        const { department } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const query = {
            date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
            status: { $in: ['Scheduled', 'Confirmed', 'In Progress'] },
        };

        if (department) query.department = department;

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone')
            .populate('doctor', 'userId department')
            .sort({ time: 1 });

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
// UPDATE QUEUE STATUS
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
// GET PATIENT APPOINTMENTS
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
