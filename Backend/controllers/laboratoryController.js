const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');

// @desc    Get all lab tests
// @route   GET /api/laboratory
// @access  Private
exports.getLabTests = async (req, res) => {
    try {
        const { patient, doctor, status, category, page = 1, limit = 20 } = req.query;
        const query = {};

        if (patient) query.patient = patient;
        if (doctor) query.doctor = doctor;
        if (status) query.status = status;
        if (category) query.category = category;

        const tests = await LabTest.find(query)
            .populate('patient', 'fullName patientId')
            .populate('doctor', 'userId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await LabTest.countDocuments(query);

        res.status(200).json({
            success: true,
            data: tests,
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

// @desc    Get single lab test
// @route   GET /api/laboratory/:id
// @access  Private
exports.getLabTest = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id)
            .populate('patient', 'fullName patientId')
            .populate('doctor', 'userId');
        
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }
        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create lab test
// @route   POST /api/laboratory
// @access  Private
exports.createLabTest = async (req, res) => {
    try {
        const testData = req.body;
        testData.testId = `LAB-${Date.now()}`;
        
        const test = await LabTest.create(testData);

        // Create notification for patient
        const patient = await Patient.findById(testData.patient);
        if (patient) {
            await Notification.create({
                notificationId: `NOT-${Date.now()}`,
                recipient: patient.userId || testData.patient,
                title: 'Lab Test Ordered',
                message: `A ${testData.testName} lab test has been ordered for you.`,
                type: 'Lab Result',
                priority: 'Medium',
                link: `/laboratory/${test._id}`,
            });
        }

        res.status(201).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update lab test
// @route   PUT /api/laboratory/:id
// @access  Private
exports.updateLabTest = async (req, res) => {
    try {
        const test = await LabTest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }
        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete lab test
// @route   DELETE /api/laboratory/:id
// @access  Private
exports.deleteLabTest = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }
        test.status = 'Cancelled';
        await test.save();
        res.status(200).json({
            success: true,
            message: 'Lab test cancelled successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Collect sample
// @route   PUT /api/laboratory/:id/collect-sample
// @access  Private
exports.collectSample = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }

        await test.updateStatus('Sample Collected', req.user.id);
        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Receive sample
// @route   PUT /api/laboratory/:id/receive-sample
// @access  Private
exports.receiveSample = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }

        await test.updateStatus('Received', req.user.id);
        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Enter results
// @route   PUT /api/laboratory/:id/enter-results
// @access  Private
exports.enterResults = async (req, res) => {
    try {
        const { results, notes } = req.body;
        const test = await LabTest.findById(req.params.id);
        
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }

        test.results = results;
        test.notes = notes;
        await test.updateStatus('Completed', req.user.id);

        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Verify results
// @route   PUT /api/laboratory/:id/verify-results
// @access  Private
exports.verifyResults = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }

        await test.updateStatus('Verified', req.user.id);

        // Notify doctor
        if (test.doctor) {
            const doctor = await Doctor.findById(test.doctor);
            if (doctor) {
                await Notification.create({
                    notificationId: `NOT-${Date.now()}`,
                    recipient: doctor.userId,
                    title: 'Lab Results Ready',
                    message: `Lab results for ${test.testName} are now available.`,
                    type: 'Lab Result',
                    priority: 'High',
                    link: `/laboratory/${test._id}`,
                });
            }
        }

        res.status(200).json({
            success: true,
            data: test,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get pending tests
// @route   GET /api/laboratory/pending
// @access  Private
exports.getPendingTests = async (req, res) => {
    try {
        const tests = await LabTest.getPending()
            .populate('patient', 'fullName patientId')
            .populate('doctor', 'userId');
        
        res.status(200).json({
            success: true,
            data: tests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get today's tests
// @route   GET /api/laboratory/today
// @access  Private
exports.getTodayTests = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tests = await LabTest.find({
            createdAt: { $gte: today, $lt: tomorrow },
        })
            .populate('patient', 'fullName patientId')
            .populate('doctor', 'userId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tests,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get lab dashboard
// @route   GET /api/laboratory/dashboard
// @access  Private
exports.getLabDashboard = async (req, res) => {
    try {
        const total = await LabTest.countDocuments();
        const pending = await LabTest.countDocuments({
            status: { $in: ['Pending', 'Sample Collected', 'Received', 'Processing'] },
        });
        const completed = await LabTest.countDocuments({ status: 'Verified' });
        
        // Tests by category
        const byCategory = await LabTest.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                pending,
                completed,
                byCategory,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient lab results
// @route   GET /api/laboratory/patient/:patientId
// @access  Private
exports.getPatientLabResults = async (req, res) => {
    try {
        const results = await LabTest.find({
            patient: req.params.patientId,
            status: 'Verified',
        })
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

// @desc    Generate lab report
// @route   GET /api/laboratory/:id/report
// @access  Private
exports.generateLabReport = async (req, res) => {
    try {
        const test = await LabTest.findById(req.params.id)
            .populate('patient', 'fullName patientId dateOfBirth gender')
            .populate('doctor', 'userId')
            .populate('resultVerifiedBy', 'fullName');

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Lab test not found',
            });
        }

        // Format report data
        const report = {
            testId: test.testId,
            patient: test.patient,
            testName: test.testName,
            category: test.category,
            sampleType: test.sampleType,
            results: test.results,
            referenceRange: test.referenceRange,
            notes: test.notes,
            verifiedBy: test.resultVerifiedBy,
            verifiedAt: test.resultVerifiedAt,
        };

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
