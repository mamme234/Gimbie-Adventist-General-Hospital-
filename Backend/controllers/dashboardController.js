// controllers/dashboardController.js
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Bed = require('../models/Bed');
const Invoice = require('../models/Invoice');

// ===== SUPER ADMIN DASHBOARD =====
exports.getSuperAdminDashboard = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalStaff = await User.countDocuments({ role: { $ne: 'patient' } });
        const totalBeds = await Bed.countDocuments();
        const availableBeds = await Bed.countDocuments({ status: 'Available' });
        const occupiedBeds = await Bed.countDocuments({ status: 'Occupied' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayAppointments = await Appointment.countDocuments({
            date: { $gte: today, $lt: tomorrow },
        });
        
        const totalRevenue = await Invoice.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]);

        const recentPatients = await Patient.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName patientId createdAt');

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalPatients,
                    totalDoctors,
                    totalStaff,
                    totalBeds,
                    availableBeds,
                    occupiedBeds,
                    todayAppointments,
                    totalRevenue: totalRevenue[0]?.total || 0,
                },
                recentPatients,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== ADMIN DASHBOARD =====
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayAppointments = await Appointment.countDocuments({
            date: { $gte: today, $lt: tomorrow },
        });
        const availableBeds = await Bed.countDocuments({ status: 'Available' });
        const pendingInvoices = await Invoice.countDocuments({ status: 'Pending' });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalPatients,
                    todayAppointments,
                    availableBeds,
                    pendingInvoices,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== DOCTOR DASHBOARD =====
exports.getDoctorDashboard = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user.id });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found',
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppointments = await Appointment.countDocuments({
            doctor: doctor._id,
            date: { $gte: today, $lt: tomorrow },
        });

        const totalPatients = await Appointment.distinct('patient', {
            doctor: doctor._id,
            status: 'Completed',
        });

        const pendingAppointments = await Appointment.countDocuments({
            doctor: doctor._id,
            status: { $in: ['Scheduled', 'Confirmed'] },
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    todayAppointments,
                    totalPatients: totalPatients.length,
                    pendingAppointments,
                    rating: doctor.rating || 0,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== NURSE DASHBOARD =====
exports.getNurseDashboard = async (req, res) => {
    try {
        const assignedPatients = await Patient.countDocuments({
            assignedNurse: req.user.id,
            status: 'Active',
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pendingVitals = await Appointment.countDocuments({
            date: { $gte: today },
            status: { $in: ['Scheduled', 'Confirmed'] },
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    assignedPatients,
                    pendingVitals,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== PATIENT DASHBOARD =====
exports.getPatientDashboard = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient profile not found',
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingAppointments = await Appointment.find({
            patient: patient._id,
            date: { $gte: today },
            status: { $in: ['Scheduled', 'Confirmed'] },
        }).sort({ date: 1 });

        const pastAppointments = await Appointment.countDocuments({
            patient: patient._id,
            status: 'Completed',
        });

        const pendingBills = await Invoice.find({
            patient: patient._id,
            status: { $in: ['Pending', 'Partially Paid'] },
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    upcomingAppointments: upcomingAppointments.length,
                    pastAppointments,
                    pendingBills: pendingBills.length,
                },
                upcomingAppointments,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== RECEPTION DASHBOARD =====
exports.getReceptionDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAppointments = await Appointment.countDocuments({
            date: { $gte: today },
        });

        const totalPatients = await Patient.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    todayAppointments,
                    totalPatients,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== PHARMACY DASHBOARD =====
exports.getPharmacyDashboard = async (req, res) => {
    try {
        const Medication = require('../models/Medication');
        const totalMedications = await Medication.countDocuments({ isActive: true });
        const lowStock = await Medication.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
            isActive: true,
        });
        const outOfStock = await Medication.countDocuments({
            stockQuantity: 0,
            isActive: true,
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalMedications,
                    lowStock,
                    outOfStock,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== LAB DASHBOARD =====
exports.getLabDashboard = async (req, res) => {
    try {
        const LabTest = require('../models/LabTest');
        const total = await LabTest.countDocuments();
        const pending = await LabTest.countDocuments({
            status: { $in: ['Pending', 'Sample Collected', 'Received', 'Processing'] },
        });
        const completed = await LabTest.countDocuments({ status: 'Verified' });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total,
                    pending,
                    completed,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== RADIOLOGY DASHBOARD =====
exports.getRadiologyDashboard = async (req, res) => {
    try {
        const Radiology = require('../models/Radiology');
        const total = await Radiology.countDocuments();
        const pending = await Radiology.countDocuments({
            status: { $in: ['Scheduled', 'In Progress'] },
        });
        const completed = await Radiology.countDocuments({ status: 'Verified' });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total,
                    pending,
                    completed,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== ACCOUNTANT DASHBOARD =====
exports.getAccountantDashboard = async (req, res) => {
    try {
        const totalInvoices = await Invoice.countDocuments();
        const pendingInvoices = await Invoice.countDocuments({
            status: { $in: ['Pending', 'Partially Paid'] },
        });
        const paidInvoices = await Invoice.countDocuments({ status: 'Paid' });

        const totalRevenue = await Invoice.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]);

        const outstanding = await Invoice.aggregate([
            { $match: { status: { $in: ['Pending', 'Partially Paid'] } } },
            { $group: { _id: null, total: { $sum: '$balance' } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalInvoices,
                    pendingInvoices,
                    paidInvoices,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    outstanding: outstanding[0]?.total || 0,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== HR DASHBOARD =====
exports.getHRDashboard = async (req, res) => {
    try {
        const totalStaff = await User.countDocuments({ role: { $ne: 'patient' } });
        const activeStaff = await User.countDocuments({ 
            role: { $ne: 'patient' }, 
            isActive: true 
        });
        const doctors = await User.countDocuments({ role: 'doctor' });
        const nurses = await User.countDocuments({ role: 'nurse' });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalStaff,
                    activeStaff,
                    doctors,
                    nurses,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== INVENTORY DASHBOARD =====
exports.getInventoryDashboard = async (req, res) => {
    try {
        const Inventory = require('../models/Inventory');
        const total = await Inventory.countDocuments();
        const lowStock = await Inventory.countDocuments({
            $expr: { $lte: ['$quantity', '$reorderLevel'] },
        });
        const outOfStock = await Inventory.countDocuments({ quantity: 0 });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total,
                    lowStock,
                    outOfStock,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== PROCUREMENT DASHBOARD =====
exports.getProcurementDashboard = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalSuppliers: 0,
                    pendingOrders: 0,
                    completedOrders: 0,
                    totalSpent: 0,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
