import logger from "../functions/logger.js";

const ErrorHandler = (message, statusCode = 500, req, res, error = null) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    ...(error?.stack && { stack: error.stack }), // Only include stack in development
  };

  logger.error(errorData);

  return res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === "development" ? errorData : message,
  });
};

export default ErrorHandler;
