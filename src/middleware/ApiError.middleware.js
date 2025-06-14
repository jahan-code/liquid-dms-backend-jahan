import logger from "../functions/logger.js";

const ApiError = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const rawMessage = err.message || "Internal Server Error";

  // Ensure error message is a string
  const errorMessage =
    typeof rawMessage === "object" && rawMessage !== null
      ? JSON.stringify(rawMessage)
      : rawMessage;

  // Log the error
  logger.error({
    message: errorMessage,
    method: req?.method,
    url: req?.originalUrl || req?.url,
    timestamp: new Date().toISOString(),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
  });
};

export default ApiError;
