/**
 * ============================================
 * HR.ROUTES.JS - Human Resources Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Employees
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getEmployeesByPosition,
  getActiveEmployees,
  getInactiveEmployees,
  searchEmployees,
  
  // Attendance
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendance,
  getTodayAttendance,
  getMonthlyAttendance,
  markAttendance,
  
  // Leave Management
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getEmployeeLeaveRequests,
  getPendingLeaveRequests,
  getApprovedLeaveRequests,
  getRejectedLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveBalance,
  
  // Recruitment
  getJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getActiveJobPostings,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getJobApplications,
  shortlistApplication,
  scheduleInterview,
  updateInterviewStatus,
  offerJob,
  
  // Performance
  getPerformanceReviews,
  getPerformanceReviewById,
  createPerformanceReview,
  updatePerformanceReview,
  deletePerformanceReview,
  getEmployeeReviews,
  getPendingReviews,
  getCompletedReviews,
  submitReview,
  
  // Payroll
  getPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getEmployeePayroll,
  getMonthlyPayroll,
  processPayroll,
  generatePaySlip,
  
  // Training
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  getUpcomingTrainings,
  getEmployeeTrainings,
  enrollEmployee,
  completeTraining,
  
  // Reports
  getReports,
  generateReport,
  
  // Stats
  getHRStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/hr.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const employeeIdValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID'),
];

const createEmployeeValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('employmentType').isIn(['Full-Time', 'Part-Time', 'Contract', 'Internship']).withMessage('Invalid employment type'),
];

const updateEmployeeValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('status').optional().isIn(['Active', 'On Leave', 'Inactive', 'Probation']).withMessage('Invalid status'),
];

const attendanceValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('checkIn').notEmpty().withMessage('Check-in time is required'),
  body('checkOut').optional().isString(),
];

const leaveValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('type').isIn(['Annual', 'Sick', 'Maternity', 'Paternity', 'Educational', 'Other']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const jobPostingValidation = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('requirements').isArray().withMessage('Requirements must be an array'),
  body('deadline').isISO8601().withMessage('Invalid deadline'),
];

const applicationValidation = [
  body('jobPostingId').isMongoId().withMessage('Invalid job posting ID'),
  body('applicantName').notEmpty().withMessage('Applicant name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('resume').notEmpty().withMessage('Resume is required'),
];

const performanceValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('reviewerId').isMongoId().withMessage('Invalid reviewer ID'),
  body('periodStart').isISO8601().withMessage('Invalid period start'),
  body('periodEnd').isISO8601().withMessage('Invalid period end'),
  body('rating').isNumeric().withMessage('Rating must be a number'),
  body('feedback').notEmpty().withMessage('Feedback is required'),
];

const payrollValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('month').notEmpty().withMessage('Month is required'),
  body('year').isNumeric().withMessage('Year must be a number'),
  body('basicSalary').isNumeric().withMessage('Basic salary must be a number'),
  body('allowances').optional().isObject(),
  body('deductions').optional().isObject(),
];

const trainingValidation = [
  body('title').notEmpty().withMessage('Training title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Invalid date'),
  body('duration').notEmpty().withMessage('Duration is required'),
  body('trainer').notEmpty().withMessage('Trainer is required'),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'hr'));

// Employees
router.get('/employees', getEmployees);
router.get('/employees/active', getActiveEmployees);
router.get('/employees/inactive', getInactiveEmployees);
router.get('/employees/department/:department', getEmployeesByDepartment);
router.get('/employees/position/:position', getEmployeesByPosition);
router.get('/employees/search', searchEmployees);
router.post('/employees', createEmployeeValidation, createEmployee);
router.get('/employees/:id', employeeIdValidation, getEmployeeById);
router.put('/employees/:id', employeeIdValidation, updateEmployeeValidation, updateEmployee);
router.delete('/employees/:id', employeeIdValidation, deleteEmployee);

// Attendance
router.get('/attendance', getAttendance);
router.get('/attendance/today', getTodayAttendance);
router.get('/attendance/employee/:employeeId', getEmployeeAttendance);
router.get('/attendance/monthly', getMonthlyAttendance);
router.post('/attendance', attendanceValidation, createAttendance);
router.get('/attendance/:id', getAttendanceById);
router.put('/attendance/:id', attendanceValidation, updateAttendance);
router.delete('/attendance/:id', deleteAttendance);
router.post('/attendance/mark', attendanceValidation, markAttendance);

// Leave Management
router.get('/leave-requests', getLeaveRequests);
router.get('/leave-requests/pending', getPendingLeaveRequests);
router.get('/leave-requests/approved', getApprovedLeaveRequests);
router.get('/leave-requests/rejected', getRejectedLeaveRequests);
router.get('/leave-requests/employee/:employeeId', getEmployeeLeaveRequests);
router.get('/leave-requests/balance/:employeeId', getLeaveBalance);
router.post('/leave-requests', leaveValidation, createLeaveRequest);
router.get('/leave-requests/:id', getLeaveRequestById);
router.put('/leave-requests/:id', leaveValidation, updateLeaveRequest);
router.delete('/leave-requests/:id', deleteLeaveRequest);
router.post('/leave-requests/:id/approve', approveLeaveRequest);
router.post('/leave-requests/:id/reject', rejectLeaveRequest);

// Recruitment
router.get('/job-postings', getJobPostings);
router.get('/job-postings/active', getActiveJobPostings);
router.post('/job-postings', jobPostingValidation, createJobPosting);
router.get('/job-postings/:id', getJobPostingById);
router.put('/job-postings/:id', jobPostingValidation, updateJobPosting);
router.delete('/job-postings/:id', deleteJobPosting);

router.get('/applications', getApplications);
router.get('/applications/job/:jobPostingId', getJobApplications);
router.post('/applications', applicationValidation, createApplication);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id', updateApplication);
router.delete('/applications/:id', deleteApplication);
router.post('/applications/:id/shortlist', shortlistApplication);
router.post('/applications/:id/interview', scheduleInterview);
router.patch('/applications/:id/interview-status', updateInterviewStatus);
router.post('/applications/:id/offer', offerJob);

// Performance
router.get('/performance-reviews', getPerformanceReviews);
router.get('/performance-reviews/pending', getPendingReviews);
router.get('/performance-reviews/completed', getCompletedReviews);
router.get('/performance-reviews/employee/:employeeId', getEmployeeReviews);
router.post('/performance-reviews', performanceValidation, createPerformanceReview);
router.get('/performance-reviews/:id', getPerformanceReviewById);
router.put('/performance-reviews/:id', performanceValidation, updatePerformanceReview);
router.delete('/performance-reviews/:id', deletePerformanceReview);
router.post('/performance-reviews/:id/submit', submitReview);

// Payroll
router.get('/payroll', getPayroll);
router.get('/payroll/employee/:employeeId', getEmployeePayroll);
router.get('/payroll/monthly', getMonthlyPayroll);
router.post('/payroll', payrollValidation, createPayroll);
router.get('/payroll/:id', getPayrollById);
router.put('/payroll/:id', payrollValidation, updatePayroll);
router.delete('/payroll/:id', deletePayroll);
router.post('/payroll/process', processPayroll);
router.get('/payroll/:id/payslip', generatePaySlip);

// Training
router.get('/trainings', getTrainings);
router.get('/trainings/upcoming', getUpcomingTrainings);
router.get('/trainings/employee/:employeeId', getEmployeeTrainings);
router.post('/trainings', trainingValidation, createTraining);
router.get('/trainings/:id', getTrainingById);
router.put('/trainings/:id', trainingValidation, updateTraining);
router.delete('/trainings/:id', deleteTraining);
router.post('/trainings/:id/enroll', enrollEmployee);
router.post('/trainings/:id/complete', completeTraining);

// Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

// Stats
router.get('/stats', getHRStats);
router.get('/stats/daily', getDailyStats);
router.get('/stats/monthly', getMonthlyStats);

module.exports = router;
