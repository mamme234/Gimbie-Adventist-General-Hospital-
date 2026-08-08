const nodemailer = require('nodemailer');

/**
 * Email configuration
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise} - Email send result
 */
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `Gimbie Hospital <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} role - User role
 * @returns {Promise} - Email send result
 */
const sendWelcomeEmail = async (email, name, role) => {
    const subject = 'Welcome to Gimbie Adventist General Hospital';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0f5c2e; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f5f5f5; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #0f5c2e; color: #fff; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Gimbie Adventist General Hospital</h1>
                </div>
                <div class="content">
                    <h2>Welcome ${name}!</h2>
                    <p>Your account has been created successfully as a <strong>${role}</strong>.</p>
                    <p>You can now login to the hospital system using your credentials.</p>
                    <p>If you have any questions, please contact the hospital administration.</p>
                    <br>
                    <a href="${process.env.FRONTEND_URL}/login" class="btn">Login to System</a>
                </div>
                <div class="footer">
                    <p>Gimbie Adventist General Hospital &copy; ${new Date().getFullYear()}</p>
                    <p>Gimbi, West Wollega, Oromia, Ethiopia</p>
                    <p>Phone: +251 77 710 0051 | Email: gimbieadventisthosp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    return sendEmail({ to: email, subject, html });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Reset token
 * @returns {Promise} - Email send result
 */
const sendPasswordResetEmail = async (email, name, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Password Reset - Gimbie Adventist General Hospital';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0f5c2e; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f5f5f5; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #0f5c2e; color: #fff; text-decoration: none; border-radius: 5px; }
                .warning { color: #c62828; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Gimbie Adventist General Hospital</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hello ${name},</p>
                    <p>We received a request to reset your password. Click the button below to reset it.</p>
                    <br>
                    <a href="${resetLink}" class="btn">Reset Password</a>
                    <br><br>
                    <p class="warning">This link will expire in 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>Gimbie Adventist General Hospital &copy; ${new Date().getFullYear()}</p>
                    <p>Gimbi, West Wollega, Oromia, Ethiopia</p>
                    <p>Phone: +251 77 710 0051 | Email: gimbieadventisthosp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    return sendEmail({ to: email, subject, html });
};

/**
 * Send appointment confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - Patient name
 * @param {Object} appointment - Appointment details
 * @returns {Promise} - Email send result
 */
const sendAppointmentConfirmation = async (email, name, appointment) => {
    const subject = 'Appointment Confirmation - Gimbie Adventist General Hospital';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0f5c2e; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f5f5f5; }
                .details { background: #fff; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #0f5c2e; color: #fff; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Gimbie Adventist General Hospital</h1>
                </div>
                <div class="content">
                    <h2>Appointment Confirmed</h2>
                    <p>Hello ${name},</p>
                    <p>Your appointment has been confirmed.</p>
                    <div class="details">
                        <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${appointment.time}</p>
                        <p><strong>Doctor:</strong> ${appointment.doctorName || 'Doctor'}</p>
                        <p><strong>Department:</strong> ${appointment.department}</p>
                        <p><strong>Type:</strong> ${appointment.type}</p>
                        <p><strong>Queue Number:</strong> ${appointment.queueNumber || 'N/A'}</p>
                    </div>
                    <br>
                    <a href="${process.env.FRONTEND_URL}/appointments" class="btn">View Appointment</a>
                </div>
                <div class="footer">
                    <p>Gimbie Adventist General Hospital &copy; ${new Date().getFullYear()}</p>
                    <p>Gimbi, West Wollega, Oromia, Ethiopia</p>
                    <p>Phone: +251 77 710 0051 | Email: gimbieadventisthosp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    return sendEmail({ to: email, subject, html });
};

/**
 * Send lab results email
 * @param {string} email - Recipient email
 * @param {string} name - Patient name
 * @param {Object} labTest - Lab test details
 * @returns {Promise} - Email send result
 */
const sendLabResultsEmail = async (email, name, labTest) => {
    const subject = 'Lab Results Available - Gimbie Adventist General Hospital';
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0f5c2e; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f5f5f5; }
                .details { background: #fff; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #0f5c2e; color: #fff; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Gimbie Adventist General Hospital</h1>
                </div>
                <div class="content">
                    <h2>Lab Results Available</h2>
                    <p>Hello ${name},</p>
                    <p>Your lab results are now available.</p>
                    <div class="details">
                        <p><strong>Test Name:</strong> ${labTest.testName}</p>
                        <p><strong>Category:</strong> ${labTest.category}</p>
                        <p><strong>Date:</strong> ${new Date(labTest.createdAt).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${labTest.status}</p>
                    </div>
                    <br>
                    <a href="${process.env.FRONTEND_URL}/lab-results/${labTest._id}" class="btn">View Results</a>
                </div>
                <div class="footer">
                    <p>Gimbie Adventist General Hospital &copy; ${new Date().getFullYear()}</p>
                    <p>Gimbi, West Wollega, Oromia, Ethiopia</p>
                    <p>Phone: +251 77 710 0051 | Email: gimbieadventisthosp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    return sendEmail({ to: email, subject, html });
};

/**
 * Send invoice email
 * @param {string} email - Recipient email
 * @param {string} name - Patient name
 * @param {Object} invoice - Invoice details
 * @returns {Promise} - Email send result
 */
const sendInvoiceEmail = async (email, name, invoice) => {
    const subject = `Invoice #${invoice.invoiceNumber} - Gimbie Adventist General Hospital`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0f5c2e; color: #fff; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f5f5f5; }
                .invoice { background: #fff; padding: 20px; border-radius: 5px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
                .total { font-weight: bold; font-size: 18px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #0f5c2e; color: #fff; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Gimbie Adventist General Hospital</h1>
                </div>
                <div class="content">
                    <h2>Invoice Generated</h2>
                    <p>Hello ${name},</p>
                    <p>Your invoice has been generated.</p>
                    <div class="invoice">
                        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${invoice.status}</p>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td>${item.quantity}</td>
                                        <td>${item.unitPrice}</td>
                                        <td>${item.total}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <br>
                        <p><strong>Subtotal:</strong> ${invoice.subtotal}</p>
                        <p><strong>Discount:</strong> ${invoice.discount}</p>
                        <p><strong>Tax:</strong> ${invoice.tax}</p>
                        <p class="total"><strong>Total:</strong> ${invoice.total}</p>
                        <p><strong>Paid:</strong> ${invoice.paidAmount}</p>
                        <p><strong>Balance:</strong> ${invoice.balance}</p>
                    </div>
                    <br>
                    <a href="${process.env.FRONTEND_URL}/billing/${invoice._id}" class="btn">View Invoice</a>
                </div>
                <div class="footer">
                    <p>Gimbie Adventist General Hospital &copy; ${new Date().getFullYear()}</p>
                    <p>Gimbi, West Wollega, Oromia, Ethiopia</p>
                    <p>Phone: +251 77 710 0051 | Email: gimbieadventisthosp@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
    return sendEmail({ to: email, subject, html });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendAppointmentConfirmation,
    sendLabResultsEmail,
    sendInvoiceEmail,
};
