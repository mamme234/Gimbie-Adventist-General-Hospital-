const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
    try {
        const { department, specialty, isAvailable } = req.query;
        const query = {};

        if (department) query.department = department;
        if (specialty) query.specialty = specialty;
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

        const doctors = await Doctor.find(query)
            .populate('userId', 'fullName email phone profileImage');

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'fullName email phone profileImage');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        res.status(200).json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private
exports.createDoctor = async (req, res) => {
    try {
        // Check if user exists
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if user is already a doctor
        const existingDoctor = await Doctor.findOne({ userId: req.body.userId });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: 'User is already registered as a doctor',
            });
        }

        // Update user role
        user.role = 'doctor';
        await user.save();

        const doctor = await Doctor.create(req.body);
        res.status(201).json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedDoctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        await doctor.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Doctor removed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get doctor appointments
// @route   GET /api/doctors/:id/appointments
// @access  Private
exports.getDoctorAppointments = async (req, res) => {
    try {
        const { date, status } = req.query;
        const query = { doctor: req.params.id };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        if (status) query.status = status;

        const appointments = await Appointment.find(query)
            .populate('patient', 'fullName patientId phone')
            .sort({ date: 1, time: 1 });

        res.status(200).json({
            success: true,
            data: appointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get doctor patients
// @route   GET /api/doctors/:id/patients
// @access  Private
exports.getDoctorPatients = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            doctor: req.params.id,
            status: 'Completed',
        }).populate('patient', 'fullName patientId phone');

        const patientIds = [...new Set(appointments.map(a => a.patient._id.toString()))];
        const patients = await Patient.find({
            _id: { $in: patientIds },
        });

        res.status(200).json({
            success: true,
            data: patients,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get doctor availability
// @route   GET /api/doctors/:id/availability
// @access  Private
exports.getDoctorAvailability = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
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
                breakTime: doctor.breakTime,
                maxPatientsPerDay: doctor.maxPatientsPerDay,
                isAvailable: doctor.isAvailable,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/:id/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const { availableDays, availableTime, breakTime, maxPatientsPerDay, isAvailable } = req.body;

        if (availableDays) doctor.availableDays = availableDays;
        if (availableTime) doctor.availableTime = availableTime;
        if (breakTime) doctor.breakTime = breakTime;
        if (maxPatientsPerDay) doctor.maxPatientsPerDay = maxPatientsPerDay;
        if (isAvailable !== undefined) doctor.isAvailable = isAvailable;

        await doctor.save();

        res.status(200).json({
            success: true,
            data: doctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get doctor stats
// @route   GET /api/doctors/:id/stats
// @access  Private
exports.getDoctorStats = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const totalPatients = await Appointment.countDocuments({
            doctor: req.params.id,
            status: 'Completed',
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            doctor: req.params.id,
            date: { $gte: today, $lt: tomorrow },
        });

        const pendingAppointments = await Appointment.countDocuments({
            doctor: req.params.id,
            status: { $in: ['Scheduled', 'Confirmed'] },
        });

        res.status(200).json({
            success: true,
            data: {
                totalPatients,
                todayAppointments,
                pendingAppointments,
                rating: doctor.rating,
                experience: doctor.experience,
                totalAppointments: doctor.totalAppointments,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get doctors by department
// @route   GET /api/doctors/by-department/:department
// @access  Public
exports.getDoctorsByDepartment = async (req, res) => {
    try {
        const doctors = await Doctor.find({
            department: req.params.department,
            isAvailable: true,
        }).populate('userId', 'fullName email phone profileImage');

        res.status(200).json({
            success: true,
            data: doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
