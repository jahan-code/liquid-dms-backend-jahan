import Joi from "joi";
import errorConstants from "../utils/errors.js";

const emailSchema = Joi.string().email().required().messages({
  "string.base": errorConstants.AUTHENTICATION.EMAIL_MUST_BE_STRING,
  "string.email": errorConstants.AUTHENTICATION.EMAIL_INVALID,
  "any.required": errorConstants.AUTHENTICATION.EMAIL_REQUIRED,
});

const usernameSchema = Joi.string().trim().min(2).max(50).required().messages({
  "string.base": errorConstants.AUTHENTICATION.NAME_MUST_BE_STRING,
  "string.empty": errorConstants.AUTHENTICATION.NAME_REQUIRED,
  "string.min": errorConstants.AUTHENTICATION.NAME_MIN_LENGTH,
  "string.max": errorConstants.AUTHENTICATION.NAME_MAX_LENGTH,
  "any.required": errorConstants.AUTHENTICATION.NAME_REQUIRED,
});

const passwordSchema = Joi.string()
  .trim()
  .min(6)
  .max(50)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/)
  .required()
  .messages({
    "string.base": errorConstants.AUTHENTICATION.PASSWORD_MUST_BE_STRING,
    "string.empty": errorConstants.AUTHENTICATION.PASSWORD_REQUIRED,
    "string.min": errorConstants.AUTHENTICATION.PASSWORD_MIN_LENGTH,
    "string.max": errorConstants.AUTHENTICATION.PASSWORD_MAX_LENGTH,
    "string.pattern.base":
      errorConstants.AUTHENTICATION.PASSWORD_COMPLEXITY ||
      "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
    "any.required": errorConstants.AUTHENTICATION.PASSWORD_REQUIRED,
  });

const otpSchema = Joi.string()
  .trim()
  .length(4)
  .pattern(/^[0-9]+$/)
  .required()
  .messages({
    "string.base":
      errorConstants.AUTHENTICATION.OTP_MUST_BE_STRING ||
      "OTP must be a string",
    "string.length":
      errorConstants.AUTHENTICATION.OTP_INVALID_LENGTH ||
      "OTP must be 4 digits",
    "string.pattern.base":
      errorConstants.AUTHENTICATION.OTP_INVALID_FORMAT ||
      "OTP must contain only digits",
    "string.empty":
      errorConstants.AUTHENTICATION.OTP_REQUIRED || "OTP is required",
    "any.required":
      errorConstants.AUTHENTICATION.OTP_REQUIRED || "OTP is required",
  });

const registerSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

const verifyOtpSchema = Joi.object({
  email: emailSchema,
  otp: otpSchema,
});

const resetPasswordSchema = Joi.object({
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
});
const resendOtpSchema = Joi.object({
  email: emailSchema,
});
export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  resendOtpSchema,
};
