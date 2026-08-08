const Insurance = require('../models/Insurance');
const Patient = require('../models/Patient');
const { generateInsuranceId, generateClaimNumber } = require('../utils/generateId');

// ===== INSURANCE PROVIDERS =====

// @desc    Get all insurance providers
// @route   GET /api/insurance/providers
// @access  Private
exports.getInsuranceProviders = async (req, res) => {
    try {
        const providers = await Insurance.find()
            .sort({ provider: 1 });

        res.status(200).json({
            success: true,
            data: providers,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single insurance provider
// @route   GET /api/insurance/providers/:id
// @access  Private
exports.getInsuranceProvider = async (req, res) => {
    try {
        const provider = await Insurance.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Insurance provider not found',
            });
        }
        res.status(200).json({
            success: true,
            data: provider,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create insurance provider
// @route   POST /api/insurance/providers
// @access  Private (Admin)
exports.createInsuranceProvider = async (req, res) => {
    try {
        const providerData = req.body;
        providerData.insuranceId = generateInsuranceId();

        const provider = await Insurance.create(providerData);
        res.status(201).json({
            success: true,
            data: provider,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update insurance provider
// @route   PUT /api/insurance/providers/:id
// @access  Private (Admin)
exports.updateInsuranceProvider = async (req, res) => {
    try {
        const provider = await Insurance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Insurance provider not found',
            });
        }
        res.status(200).json({
            success: true,
            data: provider,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete insurance provider
// @route   DELETE /api/insurance/providers/:id
// @access  Private (Admin)
exports.deleteInsuranceProvider = async (req, res) => {
    try {
        const provider = await Insurance.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Insurance provider not found',
            });
        }
        provider.status = 'Cancelled';
        await provider.save();
        res.status(200).json({
            success: true,
            message: 'Insurance provider deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== PATIENT INSURANCE =====

// @desc    Get patient insurance
// @route   GET /api/insurance/patient/:patientId
// @access  Private
exports.getPatientInsurance = async (req, res) => {
    try {
        const insurance = await Insurance.find({
            patient: req.params.patientId,
            status: 'Active',
        });
        res.status(200).json({
            success: true,
            data: insurance,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add patient insurance
// @route   POST /api/insurance/patient/:patientId
// @access  Private
exports.addPatientInsurance = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const insuranceData = req.body;
        insuranceData.insuranceId = generateInsuranceId();
        insuranceData.patient = req.params.patientId;

        const insurance = await Insurance.create(insuranceData);

        res.status(201).json({
            success: true,
            data: insurance,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update patient insurance
// @route   PUT /api/insurance/patient/:patientId
// @access  Private
exports.updatePatientInsurance = async (req, res) => {
    try {
        const insurance = await Insurance.findOne({
            patient: req.params.patientId,
            status: 'Active',
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'No active insurance found for this patient',
            });
        }

        const updatedInsurance = await Insurance.findByIdAndUpdate(
            insurance._id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedInsurance,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify insurance
// @route   POST /api/insurance/verify
// @access  Private
exports.verifyInsurance = async (req, res) => {
    try {
        const { insuranceId, policyNumber, service, amount } = req.body;

        const insurance = await Insurance.findOne({
            insuranceId,
            policyNumber,
            status: 'Active',
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found or inactive',
            });
        }

        // Check coverage
        const coverage = insurance.checkCoverage(service, amount);

        res.status(200).json({
            success: true,
            data: {
                verified: coverage.covered,
                insurance: {
                    provider: insurance.provider,
                    policyNumber: insurance.policyNumber,
                },
                coverage,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== INSURANCE CLAIMS =====

// @desc    Get all claims
// @route   GET /api/insurance/claims
// @access  Private
exports.getClaims = async (req, res) => {
    try {
        const { status, patient, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) query['insuranceClaim.status'] = status;
        if (patient) query.patient = patient;

        const claims = await Insurance.find(query)
            .populate('patient', 'fullName patientId')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Insurance.countDocuments(query);

        res.status(200).json({
            success: true,
            data: claims,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single claim
// @route   GET /api/insurance/claims/:id
// @access  Private
exports.getClaim = async (req, res) => {
    try {
        const claim = await Insurance.findById(req.params.id)
            .populate('patient', 'fullName patientId phone');
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found',
            });
        }
        res.status(200).json({
            success: true,
            data: claim,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit claim
// @route   POST /api/insurance/claims
// @access  Private
exports.submitClaim = async (req, res) => {
    try {
        const { patient, provider, amount, service, notes } = req.body;

        const insurance = await Insurance.findOne({
            patient,
            provider,
            status: 'Active',
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Active insurance not found for this patient',
            });
        }

        // Create claim using Invoice model's insuranceClaim field
        const Invoice = require('../models/Invoice');
        const invoice = await Invoice.create({
            invoiceNumber: `CLAIM-${Date.now()}`,
            patient,
            patientName: (await Patient.findById(patient)).fullName,
            items: [{
                description: service,
                category: 'Insurance',
                quantity: 1,
                unitPrice: amount,
                total: amount,
            }],
            subtotal: amount,
            total: amount,
            status: 'Pending',
            insuranceClaim: {
                submitted: true,
                claimNumber: generateClaimNumber(),
                submittedDate: new Date(),
                amount,
                status: 'Submitted',
                notes,
            },
            issuedBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update claim status
// @route   PUT /api/insurance/claims/:id
// @access  Private
exports.updateClaimStatus = async (req, res) => {
    try {
        const { status, approvedAmount, notes } = req.body;
        const Invoice = require('../models/Invoice');
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found',
            });
        }

        invoice.insuranceClaim.status = status;
        if (approvedAmount) invoice.insuranceClaim.approvedAmount = approvedAmount;
        if (notes) invoice.insuranceClaim.notes = notes;

        if (status === 'Approved') {
            invoice.insuranceClaim.approvedDate = new Date();
        }

        await invoice.save();

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get insurance dashboard
// @route   GET /api/insurance/dashboard
// @access  Private
exports.getInsuranceDashboard = async (req, res) => {
    try {
        const totalProviders = await Insurance.countDocuments({ status: 'Active' });
        const totalPatients = await Insurance.distinct('patient', { status: 'Active' });

        const Invoice = require('../models/Invoice');
        const pendingClaims = await Invoice.countDocuments({
            'insuranceClaim.submitted': true,
            'insuranceClaim.status': 'Submitted',
        });

        const approvedClaims = await Invoice.countDocuments({
            'insuranceClaim.submitted': true,
            'insuranceClaim.status': 'Approved',
        });

        const totalAmount = await Invoice.aggregate([
            { $match: { 'insuranceClaim.submitted': true } },
            { $group: { _id: null, total: { $sum: '$insuranceClaim.amount' } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProviders,
                totalPatients: totalPatients.length,
                pendingClaims,
                approvedClaims,
                totalClaimAmount: totalAmount[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
