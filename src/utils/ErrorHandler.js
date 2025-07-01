import logger from '../functions/logger.js';

const ErrorHandler = (message, statusCode = 500, req, res, error = null) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    method: req?.method || 'N/A',
    path: req?.originalUrl || 'N/A',
    statusCode,
    message,
    ...(error?.stack && { stack: error.stack }),
    ...(req?.session && {
      sessionID: req.sessionID, // 🔍 Redis session ID
      sessionEmail: req.session.email,
      sessionOtpContext: req.session.otpContext,
      sessionExpiresAt: req.session.expiresAt,
      sessionOtpVerified: req.session.otpVerified,
    }),
  };

  // Log to file or console
  logger.error(errorData);

  // Send safe response to client
  return res?.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === 'development'
        ? errorData
        : message || 'Something went wrong',
  });
};

export default ErrorHandler;
