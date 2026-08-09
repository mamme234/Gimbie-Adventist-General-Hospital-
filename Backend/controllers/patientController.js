const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const LabTest = require('../models/LabTest');
const { generatePatientId } = require('../utils/generateId');

// @desc    Get patient by userId (for current user)
// @route   GET /api/patients/me
// @access  Private
exports.getMyPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient profile not found. Please contact admin.',
            });
        }

        // Get additional stats
        const upcomingAppointments = await Appointment.countDocuments({
            patient: patient._id,
            date: { $gte: new Date() },
            status: { $in: ['Scheduled', 'Confirmed'] },
        });

        const totalRecords = patient.medicalHistory?.length || 0;
        const activePrescriptions = patient.medications?.filter(m => m.status === 'Active').length || 0;

        // Get outstanding balance
        const invoices = await Invoice.find({
            patient: patient._id,
            status: { $in: ['Pending', 'Partially Paid'] },
        });
        const outstandingBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

        res.status(200).json({
            success: true,
            data: {
                ...patient.toObject(),
                upcomingAppointments,
                totalRecords,
                activePrescriptions,
                outstandingBalance,
            },
        });
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find().populate('userId', 'fullName email');
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

// @desc    Create patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        patientData.patientId = generatePatientId();
        patientData.registeredBy = req.user.id;

        const patient = await Patient.create(patientData);
        res.status(201).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const updatedPatient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedPatient,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient appointments
// @route   GET /api/patients/:id/appointments
// @access  Private
exports.getPatientAppointments = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const appointments = await Appointment.find({ patient: patient._id })
            .populate('doctor', 'userId')
            .populate({
                path: 'doctor',
                populate: {
                    path: 'userId',
                    select: 'fullName',
                },
            })
            .sort({ date: -1 });

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

// @desc    Get patient bills
// @route   GET /api/patients/:id/bills
// @access  Private
exports.getPatientBills = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const invoices = await Invoice.find({ patient: patient._id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: invoices,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient medical history
// @route   GET /api/patients/:id/history
// @access  Private
exports.getPatientHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            success: true,
            data: patient.medicalHistory || [],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient lab results
// @route   GET /api/patients/:id/lab-results
// @access  Private
exports.getPatientLabResults = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const results = await LabTest.find({ patient: patient._id, status: 'Verified' })
            .populate('doctor', 'userId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: results,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
