/**
 * ============================================
 * INSURANCE.CONTROLLER.JS - Insurance Controller
 * ============================================
 */

const InsuranceProvider = require('../models/InsuranceProvider');
const InsurancePolicy = require('../models/InsurancePolicy');
const InsuranceClaim = require('../models/InsuranceClaim');
const InsuranceCoverage = require('../models/InsuranceCoverage');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all providers
 */
const getProviders = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const providers = await InsuranceProvider.find(query)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    logger.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get providers',
      error: error.message
    });
  }
};

/**
 * Get provider by ID
 */
const getProviderById = async (req, res) => {
  try {
    const provider = await InsuranceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: provider
    });
  } catch (error) {
    logger.error('Get provider by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider',
      error: error.message
    });
  }
};

/**
 * Create provider
 */
const createProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      name,
      code,
      contact,
      phone,
      email,
      address,
      website,
      notes
    } = req.body;

    const provider = new InsuranceProvider({
      name,
      code: code.toUpperCase(),
      contact,
      phone,
      email,
      address,
      website,
      notes,
      isActive: true
    });

    await provider.save();

    logger.info(`Insurance provider created: ${provider.name}`);

    res.status(201).json({
      success: true,
      message: 'Insurance provider created successfully',
      data: provider
    });
  } catch (error) {
    logger.error('Create provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create provider',
      error: error.message
    });
  }
};

/**
 * Update provider
 */
const updateProvider = async (req, res) => {
  try {
    const provider = await InsuranceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const {
      name,
      code,
      contact,
      phone,
      email,
      address,
      website,
      notes,
      isActive
    } = req.body;

    if (name) provider.name = name;
    if (code) provider.code = code.toUpperCase();
    if (contact) provider.contact = contact;
    if (phone) provider.phone = phone;
    if (email) provider.email = email;
    if (address) provider.address = address;
    if (website) provider.website = website;
    if (notes) provider.notes = notes;
    if (isActive !== undefined) provider.isActive = isActive;

    await provider.save();

    logger.info(`Insurance provider updated: ${provider.name}`);

    res.status(200).json({
      success: true,
      message: 'Insurance provider updated successfully',
      data: provider
    });
  } catch (error) {
    logger.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: error.message
    });
  }
};

/**
 * Delete provider
 */
const deleteProvider = async (req, res) => {
  try {
    const provider = await InsuranceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    provider.isActive = false;
    await provider.save();

    logger.info(`Insurance provider deactivated: ${provider.name}`);

    res.status(200).json({
      success: true,
      message: 'Insurance provider deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate provider',
      error: error.message
    });
  }
};

/**
 * Get active providers
 */
const getActiveProviders = async (req, res) => {
  try {
    const providers = await InsuranceProvider.find({
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    logger.error('Get active providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active providers',
      error: error.message
    });
  }
};

/**
 * Get policies
 */
const getPolicies = async (req, res) => {
  try {
    const { page = 1, limit = 20, providerId, patientId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (providerId) query.provider = providerId;
    if (patientId) query.patient = patientId;
    if (status) query.status = status;

    const policies = await InsurancePolicy.find(query)
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await InsurancePolicy.countDocuments(query);

    res.status(200).json({
      success: true,
      data: policies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get policies',
      error: error.message
    });
  }
};

/**
 * Get policy by ID
 */
const getPolicyById = async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('provider', 'name code');

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    logger.error('Get policy by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get policy',
      error: error.message
    });
  }
};

/**
 * Create policy
 */
const createPolicy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      patientId,
      providerId,
      policyNumber,
      startDate,
      endDate,
      coverageAmount,
      premium,
      coverageDetails,
      status
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const provider = await InsuranceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const policy = new InsurancePolicy({
      patient: patientId,
      provider: providerId,
      policyNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverageAmount,
      premium: premium || 0,
      coverageDetails: coverageDetails || [],
      status: status || 'Active'
    });

    await policy.save();

    logger.info(`Insurance policy created for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Insurance policy created successfully',
      data: policy
    });
  } catch (error) {
    logger.error('Create policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create policy',
      error: error.message
    });
  }
};

/**
 * Update policy
 */
const updatePolicy = async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const {
      policyNumber,
      startDate,
      endDate,
      coverageAmount,
      premium,
      coverageDetails,
      status
    } = req.body;

    if (policyNumber) policy.policyNumber = policyNumber;
    if (startDate) policy.startDate = new Date(startDate);
    if (endDate) policy.endDate = new Date(endDate);
    if (coverageAmount) policy.coverageAmount = coverageAmount;
    if (premium) policy.premium = premium;
    if (coverageDetails) policy.coverageDetails = coverageDetails;
    if (status) policy.status = status;

    await policy.save();

    logger.info(`Insurance policy updated: ${policy.policyNumber}`);

    res.status(200).json({
      success: true,
      message: 'Insurance policy updated successfully',
      data: policy
    });
  } catch (error) {
    logger.error('Update policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update policy',
      error: error.message
    });
  }
};

/**
 * Delete policy
 */
const deletePolicy = async (req, res) => {
  try {
    const policy = await InsurancePolicy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    policy.status = 'Cancelled';
    await policy.save();

    logger.info(`Insurance policy cancelled: ${policy.policyNumber}`);

    res.status(200).json({
      success: true,
      message: 'Insurance policy cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete policy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel policy',
      error: error.message
    });
  }
};

/**
 * Get patient policies
 */
const getPatientPolicies = async (req, res) => {
  try {
    const { patientId } = req.params;

    const policies = await InsurancePolicy.find({ patient: patientId })
      .populate('provider', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: policies
    });
  } catch (error) {
    logger.error('Get patient policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient policies',
      error: error.message
    });
  }
};

/**
 * Get active policies
 */
const getActivePolicies = async (req, res) => {
  try {
    const policies = await InsurancePolicy.find({
      status: 'Active',
      endDate: { $gte: new Date() }
    })
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: policies
    });
  } catch (error) {
    logger.error('Get active policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active policies',
      error: error.message
    });
  }
};

/**
 * Get expiring policies
 */
const getExpiringPolicies = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const policies = await InsurancePolicy.find({
      status: 'Active',
      endDate: { $lte: thirtyDaysFromNow }
    })
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .sort({ endDate: 1 });

    res.status(200).json({
      success: true,
      data: policies
    });
  } catch (error) {
    logger.error('Get expiring policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring policies',
      error: error.message
    });
  }
};

/**
 * Get claims
 */
const getClaims = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, providerId, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (providerId) query.provider = providerId;
    if (dateFrom || dateTo) {
      query.serviceDate = {};
      if (dateFrom) query.serviceDate.$gte = new Date(dateFrom);
      if (dateTo) query.serviceDate.$lte = new Date(dateTo);
    }

    const claims = await InsuranceClaim.find(query)
      .populate('patient', 'patientId')
      .populate('policy', 'policyNumber')
      .populate('provider', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await InsuranceClaim.countDocuments(query);

    res.status(200).json({
      success: true,
      data: claims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get claims',
      error: error.message
    });
  }
};

/**
 * Get claim by ID
 */
const getClaimById = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('policy', 'policyNumber')
      .populate('provider', 'name code');

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (error) {
    logger.error('Get claim by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get claim',
      error: error.message
    });
  }
};

/**
 * Create claim
 */
const createClaim = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      patientId,
      policyId,
      providerId,
      amount,
      serviceDate,
      diagnosis,
      procedure,
      documents,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const provider = await InsuranceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const claimId = `CLM-${new Date().getFullYear()}-${String(await InsuranceClaim.countDocuments() + 1).padStart(6, '0')}`;

    const claim = new InsuranceClaim({
      claimId,
      patient: patientId,
      policy: policyId,
      provider: providerId,
      amount,
      serviceDate: new Date(serviceDate),
      diagnosis,
      procedure,
      documents: documents || [],
      notes,
      status: 'Submitted'
    });

    await claim.save();

    logger.info(`Insurance claim created: ${claim.claimId}`);

    res.status(201).json({
      success: true,
      message: 'Insurance claim created successfully',
      data: claim
    });
  } catch (error) {
    logger.error('Create claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create claim',
      error: error.message
    });
  }
};

/**
 * Update claim
 */
const updateClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    const {
      amount,
      diagnosis,
      procedure,
      documents,
      notes,
      status
    } = req.body;

    if (amount) claim.amount = amount;
    if (diagnosis) claim.diagnosis = diagnosis;
    if (procedure) claim.procedure = procedure;
    if (documents) claim.documents = documents;
    if (notes) claim.notes = notes;
    if (status) claim.status = status;

    await claim.save();

    logger.info(`Insurance claim updated: ${claim.claimId}`);

    res.status(200).json({
      success: true,
      message: 'Insurance claim updated successfully',
      data: claim
    });
  } catch (error) {
    logger.error('Update claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update claim',
      error: error.message
    });
  }
};

/**
 * Delete claim
 */
const deleteClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    claim.status = 'Cancelled';
    await claim.save();

    logger.info(`Insurance claim cancelled: ${claim.claimId}`);

    res.status(200).json({
      success: true,
      message: 'Insurance claim cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel claim',
      error: error.message
    });
  }
};

/**
 * Get patient claims
 */
const getPatientClaims = async (req, res) => {
  try {
    const { patientId } = req.params;

    const claims = await InsuranceClaim.find({ patient: patientId })
      .populate('provider', 'name code')
      .populate('policy', 'policyNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    logger.error('Get patient claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient claims',
      error: error.message
    });
  }
};

/**
 * Get pending claims
 */
const getPendingClaims = async (req, res) => {
  try {
    const claims = await InsuranceClaim.find({
      status: 'Submitted'
    })
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    logger.error('Get pending claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending claims',
      error: error.message
    });
  }
};

/**
 * Get approved claims
 */
const getApprovedClaims = async (req, res) => {
  try {
    const claims = await InsuranceClaim.find({
      status: 'Approved'
    })
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .sort({ approvedDate: -1 });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    logger.error('Get approved claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get approved claims',
      error: error.message
    });
  }
};

/**
 * Get rejected claims
 */
const getRejectedClaims = async (req, res) => {
  try {
    const claims = await InsuranceClaim.find({
      status: 'Rejected'
    })
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .sort({ rejectedDate: -1 });

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    logger.error('Get rejected claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rejected claims',
      error: error.message
    });
  }
};

/**
 * Submit claim
 */
const submitClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    claim.status = 'Submitted';
    claim.submittedDate = new Date();
    await claim.save();

    logger.info(`Insurance claim submitted: ${claim.claimId}`);

    res.status(200).json({
      success: true,
      message: 'Insurance claim submitted successfully',
      data: claim
    });
  } catch (error) {
    logger.error('Submit claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit claim',
      error: error.message
    });
  }
};

/**
 * Approve claim
 */
const approveClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    const { approvedAmount, notes } = req.body;

    claim.status = 'Approved';
    claim.approvedAmount = approvedAmount || claim.amount;
    claim.approvedDate = new Date();
    if (notes) claim.notes = notes;
    await claim.save();

    logger.info(`Insurance claim approved: ${claim.claimId}`);

    res.status(200).json({
      success: true,
      message: 'Insurance claim approved successfully',
      data: claim
    });
  } catch (error) {
    logger.error('Approve claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve claim',
      error: error.message
    });
  }
};

/**
 * Reject claim
 */
const rejectClaim = async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    const { rejectionReason, notes } = req.body;

    claim.status = 'Rejected';
    claim.rejectionReason = rejectionReason;
    claim.rejectedDate = new Date();
    if (notes) claim.notes = notes;
    await claim.save();

    logger.info(`Insurance claim rejected: ${claim.claimId}`);

    res.status(200).json({
      success: true,
      message: 'Insurance claim rejected successfully',
      data: claim
    });
  } catch (error) {
    logger.error('Reject claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject claim',
      error: error.message
    });
  }
};

/**
 * Get coverage
 */
const getCoverage = async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId, providerId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (patientId) query.patient = patientId;
    if (providerId) query.provider = providerId;

    const coverages = await InsuranceCoverage.find(query)
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .populate('policy', 'policyNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await InsuranceCoverage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: coverages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coverage',
      error: error.message
    });
  }
};

/**
 * Get coverage by ID
 */
const getCoverageById = async (req, res) => {
  try {
    const coverage = await InsuranceCoverage.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('provider', 'name code')
      .populate('policy', 'policyNumber');

    if (!coverage) {
      return res.status(404).json({
        success: false,
        message: 'Coverage not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coverage
    });
  } catch (error) {
    logger.error('Get coverage by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coverage',
      error: error.message
    });
  }
};

/**
 * Create coverage
 */
const createCoverage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      patientId,
      policyId,
      providerId,
      serviceType,
      coveragePercentage,
      maxAmount,
      deductible,
      coPay,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const policy = await InsurancePolicy.findById(policyId);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const provider = await InsuranceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    const coverage = new InsuranceCoverage({
      patient: patientId,
      policy: policyId,
      provider: providerId,
      serviceType,
      coveragePercentage,
      maxAmount: maxAmount || 0,
      deductible: deductible || 0,
      coPay: coPay || 0,
      notes,
      isActive: true
    });

    await coverage.save();

    logger.info(`Insurance coverage created for patient: ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Insurance coverage created successfully',
      data: coverage
    });
  } catch (error) {
    logger.error('Create coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coverage',
      error: error.message
    });
  }
};

/**
 * Update coverage
 */
const updateCoverage = async (req, res) => {
  try {
    const coverage = await InsuranceCoverage.findById(req.params.id);
    if (!coverage) {
      return res.status(404).json({
        success: false,
        message: 'Coverage not found'
      });
    }

    const {
      serviceType,
      coveragePercentage,
      maxAmount,
      deductible,
      coPay,
      notes,
      isActive
    } = req.body;

    if (serviceType) coverage.serviceType = serviceType;
    if (coveragePercentage) coverage.coveragePercentage = coveragePercentage;
    if (maxAmount) coverage.maxAmount = maxAmount;
    if (deductible) coverage.deductible = deductible;
    if (coPay) coverage.coPay = coPay;
    if (notes) coverage.notes = notes;
    if (isActive !== undefined) coverage.isActive = isActive;

    await coverage.save();

    logger.info(`Insurance coverage updated: ${coverage._id}`);

    res.status(200).json({
      success: true,
      message: 'Insurance coverage updated successfully',
      data: coverage
    });
  } catch (error) {
    logger.error('Update coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coverage',
      error: error.message
    });
  }
};

/**
 * Delete coverage
 */
const deleteCoverage = async (req, res) => {
  try {
    const coverage = await InsuranceCoverage.findById(req.params.id);
    if (!coverage) {
      return res.status(404).json({
        success: false,
        message: 'Coverage not found'
      });
    }

    coverage.isActive = false;
    await coverage.save();

    logger.info(`Insurance coverage deactivated: ${coverage._id}`);

    res.status(200).json({
      success: true,
      message: 'Insurance coverage deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate coverage',
      error: error.message
    });
  }
};

/**
 * Get patient coverage
 */
const getPatientCoverage = async (req, res) => {
  try {
    const { patientId } = req.params;

    const coverages = await InsuranceCoverage.find({
      patient: patientId,
      isActive: true
    })
      .populate('provider', 'name code')
      .populate('policy', 'policyNumber');

    res.status(200).json({
      success: true,
      data: coverages
    });
  } catch (error) {
    logger.error('Get patient coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient coverage',
      error: error.message
    });
  }
};

/**
 * Verify coverage
 */
const verifyCoverage = async (req, res) => {
  try {
    const { patientId, serviceType } = req.body;

    const coverages = await InsuranceCoverage.find({
      patient: patientId,
      serviceType,
      isActive: true
    })
      .populate('provider', 'name code')
      .populate('policy', 'policyNumber');

    const verified = coverages.length > 0;

    res.status(200).json({
      success: true,
      data: {
        verified,
        coverages
      }
    });
  } catch (error) {
    logger.error('Verify coverage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify coverage',
      error: error.message
    });
  }
};

/**
 * Get insurance stats
 */
const getInsuranceStats = async (req, res) => {
  try {
    const [
      totalProviders,
      totalPolicies,
      totalClaims,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalCoverage
    ] = await Promise.all([
      InsuranceProvider.countDocuments({ isActive: true }),
      InsurancePolicy.countDocuments({ status: 'Active' }),
      InsuranceClaim.countDocuments(),
      InsuranceClaim.countDocuments({ status: 'Submitted' }),
      InsuranceClaim.countDocuments({ status: 'Approved' }),
      InsuranceClaim.countDocuments({ status: 'Rejected' }),
      InsuranceCoverage.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProviders,
        totalPolicies,
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalCoverage
      }
    });
  } catch (error) {
    logger.error('Get insurance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insurance stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      claimsToday,
      approvedToday
    ] = await Promise.all([
      InsuranceClaim.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      InsuranceClaim.countDocuments({
        approvedDate: { $gte: today, $lt: tomorrow }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        claimsToday,
        approvedToday
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      claimsMonth,
      approvedMonth
    ] = await Promise.all([
      InsuranceClaim.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      InsuranceClaim.countDocuments({
        approvedDate: { $gte: startOfMonth, $lt: endOfMonth }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        claimsMonth,
        approvedMonth
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate insurance reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
};

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

module.exports = {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getActiveProviders,
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPatientPolicies,
  getActivePolicies,
  getExpiringPolicies,
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim,
  getPatientClaims,
  getPendingClaims,
  getApprovedClaims,
  getRejectedClaims,
  submitClaim,
  approveClaim,
  rejectClaim,
  getCoverage,
  getCoverageById,
  createCoverage,
  updateCoverage,
  deleteCoverage,
  getPatientCoverage,
  verifyCoverage,
  getInsuranceStats,
  getDailyStats,
  getMonthlyStats,
  getReports,
  generateReport
};
