const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const LabTest = require('../models/LabTest');
const Radiology = require('../models/Radiology');
const { generatePatientId } = require('../utils/generateId');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        const query = {};

        if (status) query.status = status;
        if (search) {
            query.$or = [
                { patientId: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const patients = await Patient.find(query)
            .populate('registeredBy', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Patient.countDocuments(query);

        res.status(200).json({
            success: true,
            data: patients,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('registeredBy', 'fullName email');

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

// @desc    Create patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        patientData.patientId = generatePatientId();
        patientData.registeredBy = req.user.id;

        // Check if user exists and link
        if (patientData.email) {
            const user = await User.findOne({ email: patientData.email });
            if (user) {
                patientData.userId = user._id;
            }
        }

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

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Soft delete - set status to Inactive
        patient.status = 'Inactive';
        await patient.save();

        res.status(200).json({
            success: true,
            message: 'Patient deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private
exports.searchPatients = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        const patients = await Patient.search(q);
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

// @desc    Get patient medical history
// @route   GET /api/patients/:id/history
// @access  Private
exports.getPatientHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .select('medicalHistory medications allergies');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                medicalHistory: patient.medicalHistory,
                medications: patient.medications,
                allergies: patient.allergies,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Add medical history
// @route   POST /api/patients/:id/history
// @access  Private
exports.addMedicalHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        await patient.addMedicalHistory(req.body);
        res.status(200).json({
            success: true,
            data: patient.medicalHistory,
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
        const appointments = await Appointment.find({ patient: req.params.id })
            .populate('doctor', 'userId')
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
        const bills = await Invoice.find({ patient: req.params.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bills,
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
        const results = await LabTest.find({ patient: req.params.id })
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

// @desc    Get patient radiology
// @route   GET /api/patients/:id/radiology
// @access  Private
exports.getPatientRadiology = async (req, res) => {
    try {
        const radiology = await Radiology.find({ patient: req.params.id })
            .populate('doctor', 'userId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: radiology,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
