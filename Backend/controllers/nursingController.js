const Patient = require('../models/Patient');
const User = require('../models/User');
const Bed = require('../models/Bed');
const Appointment = require('../models/Appointment');

// @desc    Get nurse dashboard
// @route   GET /api/nursing/dashboard
// @access  Private (Nurse)
exports.getNurseDashboard = async (req, res) => {
    try {
        const nurseId = req.user.id;
        
        // Get assigned patients
        const assignedPatients = await Patient.find({
            'assignedNurse': nurseId,
            status: 'Active'
        }).countDocuments();

        // Get today's vitals to record
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pendingVitals = await Appointment.find({
            date: { $gte: today },
            status: { $in: ['Scheduled', 'Confirmed'] }
        }).countDocuments();

        res.status(200).json({
            success: true,
            data: {
                assignedPatients,
                pendingVitals,
                shifts: [],
                recentActivities: []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get assigned patients
// @route   GET /api/nursing/assigned-patients
// @access  Private (Nurse)
exports.getAssignedPatients = async (req, res) => {
    try {
        const nurseId = req.user.id;
        
        const patients = await Patient.find({
            'assignedNurse': nurseId,
            status: 'Active'
        }).populate('userId', 'fullName phone');

        res.status(200).json({
            success: true,
            data: patients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get patient vitals
// @route   GET /api/nursing/vitals/:patientId
// @access  Private (Nurse)
exports.getPatientVitals = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // This would typically fetch from a Vitals model
        // For now, return placeholder
        res.status(200).json({
            success: true,
            data: {
                patientId,
                vitals: [],
                lastRecorded: null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update patient vitals
// @route   POST /api/nursing/vitals/:patientId
// @access  Private (Nurse)
exports.updateVitals = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, weight, height } = req.body;

        // This would typically save to a Vitals model
        // For now, return success
        res.status(200).json({
            success: true,
            message: 'Vitals recorded successfully',
            data: {
                patientId,
                vitals: {
                    bloodPressure,
                    heartRate,
                    temperature,
                    respiratoryRate,
                    oxygenSaturation,
                    weight,
                    height,
                    recordedAt: new Date()
                },
                recordedBy: req.user.id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get nursing notes
// @route   GET /api/nursing/notes/:patientId
// @access  Private (Nurse)
exports.getNursingNotes = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // This would typically fetch from a NursingNotes model
        res.status(200).json({
            success: true,
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create nursing note
// @route   POST /api/nursing/notes/:patientId
// @access  Private (Nurse)
exports.createNursingNote = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { note, type } = req.body;

        // This would typically save to a NursingNotes model
        res.status(201).json({
            success: true,
            message: 'Nursing note created successfully',
            data: {
                patientId,
                note,
                type,
                createdBy: req.user.id,
                createdAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get ward patients
// @route   GET /api/nursing/ward/:wardId
// @access  Private (Nurse)
exports.getWardPatients = async (req, res) => {
    try {
        const { wardId } = req.params;
        
        const beds = await Bed.find({
            ward: wardId,
            status: 'Occupied'
        }).populate('patient', 'fullName patientId');

        res.status(200).json({
            success: true,
            data: beds
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Assign bed to patient
// @route   PUT /api/nursing/assign-bed/:patientId
// @access  Private (Nurse)
exports.assignBed = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { bedId } = req.body;

        const bed = await Bed.findById(bedId);
        if (!bed) {
            return res.status(404).json({
                success: false,
                message: 'Bed not found'
            });
        }

        if (bed.status !== 'Available') {
            return res.status(400).json({
                success: false,
                message: 'Bed is not available'
            });
        }

        bed.status = 'Occupied';
        bed.patient = patientId;
        bed.admissionDate = new Date();
        bed.assignedNurse = req.user.id;
        await bed.save();

        res.status(200).json({
            success: true,
            message: 'Bed assigned successfully',
            data: bed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Discharge patient
// @route   PUT /api/nursing/discharge/:patientId
// @access  Private (Nurse)
exports.dischargePatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { dischargeSummary, dischargeDate } = req.body;

        // Find patient's bed
        const bed = await Bed.findOne({
            patient: patientId,
            status: 'Occupied'
        });

        if (bed) {
            bed.status = 'Available';
            bed.patient = null;
            bed.assignedNurse = null;
            bed.expectedDischargeDate = null;
            await bed.save();
        }

        // Update patient status
        await Patient.findByIdAndUpdate(patientId, {
            status: 'Inactive'
        });

        res.status(200).json({
            success: true,
            message: 'Patient discharged successfully',
            data: {
                patientId,
                dischargeSummary,
                dischargeDate: dischargeDate || new Date(),
                dischargedBy: req.user.id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get shift schedule
// @route   GET /api/nursing/shift
// @access  Private (Nurse)
exports.getShiftSchedule = async (req, res) => {
    try {
        // This would typically fetch from a Shift model
        res.status(200).json({
            success: true,
            data: {
                currentShift: null,
                upcomingShifts: [],
                schedule: []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update shift schedule
// @route   PUT /api/nursing/shift
// @access  Private (Nurse)
exports.updateShiftSchedule = async (req, res) => {
    try {
        const { shift, date, notes } = req.body;

        // This would typically update a Shift model
        res.status(200).json({
            success: true,
            message: 'Shift schedule updated successfully',
            data: {
                shift,
                date,
                notes,
                updatedBy: req.user.id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
