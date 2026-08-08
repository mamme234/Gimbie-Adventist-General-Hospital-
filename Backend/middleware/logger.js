const fs = require('fs');
const path = require('path');

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`;
        console.log(logMessage);
        
        // Log to file in production
        if (process.env.NODE_ENV === 'production') {
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir);
            }
            const logFile = path.join(logDir, `access-${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, logMessage + '\n');
        }
    });
    
    next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
    const logMessage = `[${new Date().toISOString()}] ERROR: ${req.method} ${req.originalUrl} - ${err.message}\nStack: ${err.stack}\n`;
    console.error(logMessage);
    
    // Log to file in production
    if (process.env.NODE_ENV === 'production') {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage);
    }
    
    next(err);
};

/**
 * Performance logger middleware
 */
const performanceLogger = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const time = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
        
        // Log performance for slow requests (> 1 second)
        if (time > 1000) {
            console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${time}ms`);
        }
    });
    
    next();
};

module.exports = {
    requestLogger,
    errorLogger,
    performanceLogger,
};
