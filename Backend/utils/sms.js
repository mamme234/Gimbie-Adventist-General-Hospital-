const twilio = require('twilio');

/**
 * SMS configuration
 */
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

/**
 * Send SMS
 * @param {string} phone - Recipient phone number
 * @param {string} message - SMS message
 * @returns {Promise} - SMS send result
 */
const sendSMS = async (phone, message) => {
    try {
        if (!twilioClient) {
            console.log('SMS not sent - Twilio not configured');
            return { success: false, message: 'SMS service not configured' };
        }

        // Format phone number
        let formattedPhone = phone;
        if (!phone.startsWith('+')) {
            formattedPhone = `+${phone}`;
        }

        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: formattedPhone,
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment reminder SMS
 * @param {string} phone - Patient phone number
 * @param {string} name - Patient name
 * @param {Object} appointment - Appointment details
 * @returns {Promise} - SMS send result
 */
const sendAppointmentReminder = async (phone, name, appointment) => {
    const date = new Date(appointment.date).toLocaleDateString();
    const message = `
        Gimbie Adventist General Hospital
        Reminder: ${name}, you have an appointment on ${date} at ${appointment.time}.
        Doctor: ${appointment.doctorName || 'Doctor'}
        Department: ${appointment.department}
        Queue: ${appointment.queueNumber || 'N/A'}
        Please arrive 15 minutes early.
        Contact: +251 77 710 0051
    `.trim();
    return sendSMS(phone, message);
};

/**
 * Send lab result ready SMS
 * @param {string} phone - Patient phone number
 * @param {string} name - Patient name
 * @param {string} testName - Lab test name
 * @returns {Promise} - SMS send result
 */
const sendLabResultReady = async (phone, name, testName) => {
    const message = `
        Gimbie Adventist General Hospital
        Hello ${name}, your lab results for ${testName} are now available.
        Please login to the patient portal to view your results.
        Contact: +251 77 710 0051
    `.trim();
    return sendSMS(phone, message);
};

/**
 * Send payment confirmation SMS
 * @param {string} phone - Patient phone number
 * @param {string} name - Patient name
 * @param {string} amount - Payment amount
 * @param {string} invoiceNumber - Invoice number
 * @returns {Promise} - SMS send result
 */
const sendPaymentConfirmation = async (phone, name, amount, invoiceNumber) => {
    const message = `
        Gimbie Adventist General Hospital
        Hello ${name}, payment of ${amount} ETB has been received.
        Invoice: ${invoiceNumber}
        Thank you for choosing Gimbie Adventist General Hospital.
        Contact: +251 77 710 0051
    `.trim();
    return sendSMS(phone, message);
};

/**
 * Send emergency notification SMS
 * @param {string} phone - Recipient phone number
 * @param {string} message - Emergency message
 * @returns {Promise} - SMS send result
 */
const sendEmergencyNotification = async (phone, message) => {
    const fullMessage = `
        URGENT - Gimbie Adventist General Hospital
        ${message}
        Contact emergency: +251 77 710 0051
    `.trim();
    return sendSMS(phone, fullMessage);
};

module.exports = {
    sendSMS,
    sendAppointmentReminder,
    sendLabResultReady,
    sendPaymentConfirmation,
    sendEmergencyNotification,
};
