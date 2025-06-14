const SuccessHandler = (data, statusCode, message, res) => {
  return res.status(statusCode).json({
    statusCode,
    message: message,
    data: data || null,
    success: true,
  });
};

export default SuccessHandler;
