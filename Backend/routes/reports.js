const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getPatientStatistics,
    getDoctorStatistics,
    getDepartmentStatistics,
    getDiseaseStatistics,
    getAdmissionReports,
    getDischargeReports,
    getEmergencyReports,
    getBedOccupancyReports,
    getPharmacyReports,
    getLaboratoryReports,
    getRadiologyReports,
    getRevenueReports,
    getExpenseReports,
    getInsuranceReports,
    getInventoryReports,
    getStaffReports,
    getFinancialAnalytics,
    getMedicalAnalytics,
    exportReportPDF,
    exportReportExcel,
} = require('../controllers/reportController');

// Protected routes
router.use(protect);
router.use(authorize('super_admin', 'admin', 'accountant', 'hr_manager'));

// Statistics routes
router.get('/patients', getPatientStatistics);
router.get('/doctors', getDoctorStatistics);
router.get('/departments', getDepartmentStatistics);
router.get('/diseases', getDiseaseStatistics);

// Reports routes
router.get('/admissions', getAdmissionReports);
router.get('/discharges', getDischargeReports);
router.get('/emergency', getEmergencyReports);
router.get('/bed-occupancy', getBedOccupancyReports);
router.get('/pharmacy', getPharmacyReports);
router.get('/laboratory', getLaboratoryReports);
router.get('/radiology', getRadiologyReports);
router.get('/revenue', getRevenueReports);
router.get('/expenses', getExpenseReports);
router.get('/insurance', getInsuranceReports);
router.get('/inventory', getInventoryReports);
router.get('/staff', getStaffReports);

// Analytics routes
router.get('/financial', getFinancialAnalytics);
router.get('/medical', getMedicalAnalytics);

// Export routes
router.get('/export/pdf', exportReportPDF);
router.get('/export/excel', exportReportExcel);

module.exports = router;
