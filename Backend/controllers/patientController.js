// controllers/patientController.js
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const LabTest = require('../models/LabTest');
const Radiology = require('../models/Radiology');
const { generatePatientId } = require('../utils/generateId');

// ============================================
// GET MY PATIENT PROFILE
// ============================================
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

// ============================================
// GET ALL PATIENTS
// ============================================
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

// ============================================
// GET PATIENT BY ID
// ============================================
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

// ============================================
// CREATE PATIENT
// ============================================
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

// ============================================
// UPDATE PATIENT
// ============================================
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

// ============================================
// DELETE PATIENT
// ============================================
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }
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

// ============================================
// SEARCH PATIENTS
// ============================================
exports.searchPatients = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required',
            });
        }

        const patients = await Patient.find({
            $or: [
                { fullName: { $regex: q, $options: 'i' } },
                { patientId: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
            ],
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

// ============================================
// GET PATIENT HISTORY
// ============================================
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

// ============================================
// ADD MEDICAL HISTORY
// ============================================
exports.addMedicalHistory = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        patient.medicalHistory.push({
            condition: req.body.condition,
            diagnosis: req.body.diagnosis,
            date: req.body.date || new Date(),
            doctor: req.body.doctor,
            notes: req.body.notes,
        });
        await patient.save();

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

// ============================================
// GET PATIENT APPOINTMENTS
// ============================================
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

// ============================================
// GET PATIENT BILLS
// ============================================
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

// ============================================
// GET PATIENT LAB RESULTS
// ============================================
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

// ============================================
// GET PATIENT RADIOLOGY
// ============================================
exports.getPatientRadiology = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const radiology = await Radiology.find({ patient: patient._id })
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
