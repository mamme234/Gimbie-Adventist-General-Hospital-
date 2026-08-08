const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const { generateInvoiceNumber } = require('../utils/generateId');
const Notification = require('../models/Notification');

// @desc    Get all invoices
// @route   GET /api/billing
// @access  Private
exports.getInvoices = async (req, res) => {
    try {
        const { patient, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (patient) query.patient = patient;
        if (status) query.status = status;

        const invoices = await Invoice.find(query)
            .populate('patient', 'fullName patientId')
            .populate('issuedBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Invoice.countDocuments(query);

        res.status(200).json({
            success: true,
            data: invoices,
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

// @desc    Get single invoice
// @route   GET /api/billing/:id
// @access  Private
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patient', 'fullName patientId phone email')
            .populate('issuedBy', 'fullName');
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }
        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create invoice
// @route   POST /api/billing
// @access  Private
exports.createInvoice = async (req, res) => {
    try {
        const invoiceData = req.body;
        invoiceData.invoiceNumber = generateInvoiceNumber();
        invoiceData.issuedBy = req.user.id;
        invoiceData.issuedDate = new Date();

        // Calculate totals
        let subtotal = 0;
        invoiceData.items.forEach(item => {
            item.total = item.quantity * item.unitPrice;
            subtotal += item.total;
        });

        invoiceData.subtotal = subtotal;
        invoiceData.total = subtotal - invoiceData.discount + invoiceData.tax;
        invoiceData.balance = invoiceData.total;

        const invoice = await Invoice.create(invoiceData);

        // Notify patient
        const patient = await Patient.findById(invoiceData.patient);
        if (patient) {
            await Notification.create({
                notificationId: `NOT-${Date.now()}`,
                recipient: patient.userId || invoiceData.patient,
                title: 'Invoice Generated',
                message: `A new invoice of ${invoiceData.total} ETB has been generated.`,
                type: 'Payment',
                priority: 'Medium',
                link: `/billing/${invoice._id}`,
            });
        }

        res.status(201).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update invoice
// @route   PUT /api/billing/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        if (invoice.status === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a paid invoice',
            });
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedInvoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete invoice
// @route   DELETE /api/billing/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        invoice.status = 'Cancelled';
        await invoice.save();

        res.status(200).json({
            success: true,
            message: 'Invoice cancelled successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Process payment
// @route   PUT /api/billing/:id/pay
// @access  Private
exports.processPayment = async (req, res) => {
    try {
        const { amount, method, reference } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        if (invoice.status === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'Invoice is already paid',
            });
        }

        await invoice.addPayment(amount, method, reference, req.user.id);

        // Notify patient
        const patient = await Patient.findById(invoice.patient);
        if (patient) {
            await Notification.create({
                notificationId: `NOT-${Date.now()}`,
                recipient: patient.userId || invoice.patient,
                title: 'Payment Received',
                message: `Payment of ${amount} ETB received. Balance: ${invoice.balance} ETB.`,
                type: 'Payment',
                priority: 'Medium',
            });
        }

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Refund payment
// @route   PUT /api/billing/:id/refund
// @access  Private
exports.refundPayment = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        if (invoice.paidAmount < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient paid amount to refund',
            });
        }

        invoice.paidAmount -= amount;
        invoice.balance = invoice.total - invoice.paidAmount;
        invoice.notes = `Refund: ${reason || 'No reason provided'}`;
        
        if (invoice.paidAmount === 0) {
            invoice.status = 'Refunded';
        } else {
            invoice.status = 'Partially Paid';
        }

        await invoice.save();

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient invoices
// @route   GET /api/billing/patient/:patientId
// @access  Private
exports.getPatientInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({
            patient: req.params.patientId,
        }).sort({ createdAt: -1 });

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

// @desc    Get outstanding balances
// @route   GET /api/billing/outstanding
// @access  Private
exports.getOutstandingBalances = async (req, res) => {
    try {
        const invoices = await Invoice.find({
            status: { $in: ['Pending', 'Partially Paid', 'Overdue'] },
            balance: { $gt: 0 },
        })
            .populate('patient', 'fullName patientId phone')
            .sort({ balance: -1 });

        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

        res.status(200).json({
            success: true,
            data: {
                totalOutstanding,
                invoices,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get revenue reports
// @route   GET /api/billing/revenue
// @access  Private
exports.getRevenueReports = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { status: 'Paid' };

        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const invoices = await Invoice.find(query);

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const count = invoices.length;

        // Revenue by category
        const byCategory = {};
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!byCategory[item.category]) {
                    byCategory[item.category] = 0;
                }
                byCategory[item.category] += item.total;
            });
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                count,
                byCategory,
                invoices,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Generate invoice PDF
// @route   GET /api/billing/:id/pdf
// @access  Private
exports.generateInvoicePDF = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patient', 'fullName patientId phone email address');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        // This would generate a PDF in production
        res.status(200).json({
            success: true,
            message: 'PDF generation endpoint',
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Send invoice email
// @route   POST /api/billing/:id/email
// @access  Private
exports.sendInvoiceEmail = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patient', 'email fullName');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        // This would send email in production
        res.status(200).json({
            success: true,
            message: 'Invoice sent to email',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get billing dashboard stats
// @route   GET /api/billing/dashboard
// @access  Private
exports.getBillingDashboard = async (req, res) => {
    try {
        const totalInvoices = await Invoice.countDocuments();
        const paidInvoices = await Invoice.countDocuments({ status: 'Paid' });
        const pendingInvoices = await Invoice.countDocuments({
            status: { $in: ['Pending', 'Partially Paid'] },
        });
        
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
                totalInvoices,
                paidInvoices,
                pendingInvoices,
                totalRevenue: totalRevenue[0]?.total || 0,
                outstanding: outstanding[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
