const SuccessHandler = (data, statusCode, message, res, options = {}) => {
  const response = {
    statusCode,
    message,
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  // ✅ Optional session ID
  if (options.sessionID) {
    response.sessionID = options.sessionID;
  }

  return res.status(statusCode).json(response);
};

export default SuccessHandler;
