// utils/response.js
class ResponseHandler {
  constructor() {
    this.defaultStatus = 200;
  }

  // Success response
  success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // Add pagination metadata if present
    if (data && data.metadata) {
      response.metadata = data.metadata;
      response.data = data.data;
    }

    return res.status(statusCode).json(response);
  }

  // Error response
  error(res, error, statusCode = 500, details = null) {
    const response = {
      success: false,
      message: this.formatErrorMessage(error),
      code: error.code || 'INTERNAL_ERROR',
      details: details || (error.details || null),
      timestamp: new Date().toISOString()
    };

    // Add validation errors if present
    if (error.errors) {
      response.errors = error.errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.stack = error.stack;
    }

    return res.status(statusCode).json(response);
  }

  // Bad request response
  badRequest(res, message = 'Bad request', details = null) {
    return this.error(res, message, 400, details);
  }

  // Unauthorized response
  unauthorized(res, message = 'Unauthorized', details = null) {
    return this.error(res, message, 401, details);
  }

  // Forbidden response
  forbidden(res, message = 'Forbidden', details = null) {
    return this.error(res, message, 403, details);
  }

  // Not found response
  notFound(res, message = 'Not found', details = null) {
    return this.error(res, message, 404, details);
  }

  // Conflict response
  conflict(res, message = 'Conflict', details = null) {
    return this.error(res, message, 409, details);
  }

  // Validation error response
  validationError(res, errors, message = 'Validation failed') {
    return res.status(422).json({
      success: false,
      message,
      code: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  // Created response
  created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  // Accepted response
  accepted(res, data = null, message = 'Request accepted') {
    return this.success(res, data, message, 202);
  }

  // No content response
  noContent(res) {
    return res.status(204).send();
  }

  // Format error message
  formatErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return 'An error occurred';
  }

  // Paginated response
  paginated(res, data, total, page, limit, baseUrl = '') {
    const pagination = require('./pagination');
    const metadata = pagination.generateMetadata(total, page, limit);
    const links = pagination.generateLinks(baseUrl, page, limit, total);

    return this.success(res, {
      data,
      metadata,
      links
    }, 'Success');
  }

  // Bulk operation response
  bulkResponse(res, results, message = 'Bulk operation completed') {
    const summary = {
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    return this.success(res, {
      summary,
      results
    }, message);
  }

  // File response
  fileResponse(res, file, filename = 'download', type = 'application/octet-stream') {
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(file);
  }

  // Stream response
  streamResponse(res, stream, filename = 'download', type = 'application/octet-stream') {
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return stream.pipe(res);
  }

  // JSONP response
  jsonp(res, data, callback = 'callback') {
    return res.jsonp(data);
  }

  // Redirect response
  redirect(res, url, statusCode = 302) {
    return res.redirect(statusCode, url);
  }

  // Response with headers
  withHeaders(res, headers, data) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.json(data);
  }

  // Set cookie response
  setCookie(res, name, value, options = {}) {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    };

    const cookieOptions = { ...defaultOptions, ...options };
    res.cookie(name, value, cookieOptions);
    return res;
  }

  // Clear cookie
  clearCookie(res, name) {
    res.clearCookie(name);
    return res;
  }

  // Send with ETag
  withETag(res, data, options = {}) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    const etag = hash.update(JSON.stringify(data)).digest('hex');
    
    res.setHeader('ETag', etag);
    
    if (options.ifNoneMatch && options.ifNoneMatch === etag) {
      return res.status(304).send();
    }
    
    return res.json(data);
  }

  // Cached response
  cached(res, data, cacheTime = 3600) {
    res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
    return res.json(data);
  }

  // No cache response
  noCache(res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res;
  }

  // CORS response
  cors(res, options = {}) {
    const defaultOptions = {
      origin: '*',
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      exposedHeaders: 'Content-Range, X-Content-Range',
      credentials: true,
      maxAge: 86400 // 24 hours
    };

    const corsOptions = { ...defaultOptions, ...options };
    
    res.setHeader('Access-Control-Allow-Origin', corsOptions.origin);
    res.setHeader('Access-Control-Allow-Methods', corsOptions.methods);
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders);
    res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders);
    
    if (corsOptions.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (corsOptions.maxAge) {
      res.setHeader('Access-Control-Max-Age', corsOptions.maxAge);
    }
    
    return res;
  }

  // Preflight response
  preflight(res) {
    return this.cors(res).status(204).send();
  }

  // Rate limit response
  rateLimit(res, limit, remaining, reset) {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
    return res;
  }

  // Content negotiation
  negotiateContent(req, handlers) {
    const accepts = req.accepts(['json', 'html', 'xml', 'plain']);
    
    if (handlers[accepts]) {
      return handlers[accepts]();
    }
    
    // Default to JSON
    return handlers.json ? handlers.json() : null;
  }

  // Download response
  download(res, filePath, filename) {
    return res.download(filePath, filename);
  }

  // Send file response
  sendFile(res, filePath, options = {}) {
    return res.sendFile(filePath, options);
  }

  // Render response (for HTML)
  render(res, view, data = {}) {
    return res.render(view, data);
  }
}

module.exports = new ResponseHandler();
