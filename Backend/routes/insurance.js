const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getInsuranceProviders,
    getInsuranceProvider,
    createInsuranceProvider,
    updateInsuranceProvider,
    deleteInsuranceProvider,
    getPatientInsurance,
    addPatientInsurance,
    updatePatientInsurance,
    verifyInsurance,
    submitClaim,
    getClaims,
    getClaim,
    updateClaimStatus,
    getInsuranceDashboard,
} = require('../controllers/insuranceController');

// Protected routes
router.use(protect);

// Insurance providers
router.route('/providers')
    .get(authorize('super_admin', 'admin', 'accountant'), getInsuranceProviders)
    .post(authorize('super_admin', 'admin'), createInsuranceProvider);

router.route('/providers/:id')
    .get(getInsuranceProvider)
    .put(authorize('super_admin', 'admin'), updateInsuranceProvider)
    .delete(authorize('super_admin', 'admin'), deleteInsuranceProvider);

// Patient insurance
router.get('/patient/:patientId', getPatientInsurance);
router.post('/patient/:patientId', authorize('super_admin', 'admin', 'receptionist'), addPatientInsurance);
router.put('/patient/:patientId', authorize('super_admin', 'admin', 'receptionist'), updatePatientInsurance);

// Insurance verification
router.post('/verify', authorize('super_admin', 'admin', 'accountant'), verifyInsurance);

// Claims
router.route('/claims')
    .get(authorize('super_admin', 'admin', 'accountant'), getClaims)
    .post(authorize('super_admin', 'admin', 'accountant'), submitClaim);

router.route('/claims/:id')
    .get(getClaim)
    .put(authorize('super_admin', 'admin', 'accountant'), updateClaimStatus);

// Dashboard
router.get('/dashboard', authorize('super_admin', 'admin', 'accountant'), getInsuranceDashboard);

module.exports = router;
