import bcrypt from 'bcryptjs';
import SuccessHandler from '../utils/SuccessHandler.js';
import user from '../models/user.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';
//hello
import otpService from '../utils/Otp.js';
import errorConstants from '../utils/errors.js';
import ApiError from '../utils/ApiError.js';
import logger from '../functions/logger.js';
import sendEmail from '../utils/sendEmail.js';
import generateAndSetJwtCookie from '../utils/jwt.js';

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }

    const existingUser = await user
      .findOne({ email: value.email.toLowerCase() })
      .lean();
    if (existingUser) {
      logger.warn({
        message: errorConstants.AUTHENTICATION.USER_ALREADY_EXISTS,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_ALREADY_EXISTS)
      );
    }

    value.email = value.email.toLowerCase();
    const newUser = await user.create(value);

    const otp = otpService.generateOTP();
    await otpService.setOTP(newUser.email, otp, 'register');

    // store context in session:
    req.session.email = newUser.email.toLowerCase();
    req.session.otpContext = 'register';
    req.session.otpVerified = false;
    req.session.expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

    try {
      await sendEmail({
        to: newUser.email,
        subject: 'Your Login OTP',
        templateName: 'otpTemplate',
        replacements: {
          fullname: newUser.fullname || 'User',
          otp: otp.toString(),
        },
      });
    } catch (emailError) {
      otpService.deleteOTP(newUser.email);
      return next(
        new ApiError(
          errorConstants.AUTHENTICATION.FAILED_TO_SEND_EMAIL ||
            emailError.message,
          500
        )
      );
    }

    const userResponse = newUser.toObject();
    delete userResponse.password;

    logger.info({
      message: '\n///Email SENT///\n///User registered successfully///\n',
      email: newUser.email,
      timestamp: new Date().toISOString(),
    });
    return SuccessHandler(
      userResponse,
      200,
      'User registered successfully',
      res,
      { sessionID: req.sessionID } // ✅ sessionID passed in options object
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return next(new ApiError(error.details[0].message, 400));

    const existingUser = await user.findOne({
      email: value.email.toLowerCase(),
    });
    if (!existingUser) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    if (!existingUser.isVerified) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 403)
      );
    }

    const isMatch = await bcrypt.compare(value.password, existingUser.password);
    if (!isMatch) {
      return next(ApiError.wrongCredentials());
    }

    const userResponse = existingUser.toObject();
    delete userResponse.password;

    const token = generateAndSetJwtCookie(userResponse, res); // ✅ pass userResponse here
    userResponse.token = token;

    logger.info({
      message: '\n///PASSWORD MATCHED///\n///User logged in successfully///\n',
      email: existingUser.email,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      userResponse,

      200,
      'User logged in successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const email = req.session?.email;
    const context = req.session?.otpContext;

    if (!email || !context) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.DATA_NOT_FOUND, 400)
      );
    }

    // If session already expired
    if (req.session.expiresAt < Date.now()) {
      req.session.destroy();
      return next(
        new ApiError(errorConstants.AUTHENTICATION.SESSION_EXPIRED, 400)
      );
    }

    // Check user existence
    const existingUser = await user.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      req.session.destroy();
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    // Prevent spamming OTP requests
    const rateLimit = otpService.trackRequest(email);
    if (!rateLimit.allowed) {
      logger.warn({
        message: `Too many OTP resend attempts: ${rateLimit.reason}`,
        email,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(rateLimit.reason, 429));
    }

    const otp = otpService.generateOTP();
    otpService.setOTP(email, otp, context);

    // Reset OTP verification and expiry time
    req.session.otpVerified = false;
    req.session.expiresAt = Date.now() + 2 * 60 * 1000;

    // Select email template and subject
    let subject, templateName;
    if (context === 'register') {
      subject = 'Your Registration OTP';
      templateName = 'otpTemplate';
    } else if (context === 'forgotPassword') {
      subject = 'Password Reset OTP';
      templateName = 'forgetPasswordTemplate';
    } else {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.UNKNOWN_CONTEXT, 400)
      );
    }

    await sendEmail({
      to: email,
      subject,
      templateName,
      replacements: {
        fullname: existingUser.fullname || 'User',
        otp: otp.toString(),
      },
    });

    logger.info({
      message: `OTP resent successfully for ${context}`,
      email,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { email, context },
      200,
      'OTP resent successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return next(new ApiError(error.details[0].message, 400));

    const existingUser = await user.findOne({
      email: value.email.toLowerCase(),
    });
    if (!existingUser) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    const rateLimit = otpService.trackRequest(value.email);
    if (!rateLimit.allowed) {
      logger.warn({
        message: `\n///Too many OTP requests: ${rateLimit.reason}///\n`,
        email: value.email,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(rateLimit.reason, 429));
    }

    const otp = otpService.generateOTP();
    otpService.setOTP(value.email, otp, 'forgotPassword');

    req.session.email = value.email.toLowerCase();
    req.session.otpContext = 'forgotPassword';
    req.session.otpVerified = false;
    req.session.expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

    try {
      await sendEmail({
        to: existingUser.email,
        subject: 'Password Reset OTP',
        templateName: 'forgetPasswordTemplate',
        replacements: {
          fullname: existingUser.fullname || 'User',
          otp: otp.toString(),
        },
      });
    } catch (emailError) {
      otpService.deleteOTP(value.email);
      req.session.destroy();

      throw new ApiError(
        errorConstants.AUTHENTICATION.FAILED_TO_SEND_EMAIL ||
          emailError.message,
        500
      );
    }

    logger.info({
      message: '\n///Password reset OTP sent (expires in 2 minutes)///\n',
      email: existingUser.email,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { email: value.email.toLowerCase() },
      200,
      'Password reset OTP sent successfully',
      res,
      { sessionID: req.sessionID }
    );
  } catch (error) {
    req.session.destroy(); // Clean up session on error
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
const verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }
    const { otp } = value;
    const email = req.session?.email;
    const context = req.session?.otpContext;

    if (!email || !context) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.OTP_SESSION_NOT_FOUND, 400)
      );
    }

    if (req.session.expiresAt < Date.now()) {
      req.session.destroy();
      return next(
        new ApiError(errorConstants.AUTHENTICATION.OTP_NOT_VERIFIED, 400)
      );
    }

    const otpResult = await otpService.verifyOTP(
      email.toLowerCase(),
      otp,
      context
    );
    if (!otpResult.valid) {
      return next(new ApiError(otpResult.reason, 400));
    }

    // Mark OTP verified for this context:
    req.session.otpVerified = true;
    delete req.session.expiresAt;

    if (context === 'register') {
      await user.updateOne(
        { email: email.toLowerCase() },
        { isVerified: true }
      );
    }

    logger.info({
      message: `\n///OTP verified successfully for ${context}///\n`,
      email,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { email: email.toLowerCase(), context },
      200,
      'OTP verified successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return next(new ApiError(error.details[0].message, 400));

    const { newPassword, confirmPassword } = value;
    const email = req.session?.email;
    const context = req.session?.otpContext;

    if (!email) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 400)
      );
    }

    if (!req.session.otpVerified && req.session.expiresAt < Date.now()) {
      req.session.destroy();
      return next(
        new ApiError(errorConstants.AUTHENTICATION.SESSION_EXPIRED, 400)
      );
    }

    // This reset password flow requires otpContext = "forgotPassword"
    if (context !== 'forgotPassword') {
      return next(
        new ApiError(
          errorConstants.AUTHENTICATION.INVALID_OTP_CONTEXT_FOR_RESET,
          400
        )
      );
    }

    if (!req.session.otpVerified) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 400)
      );
    }

    if (newPassword !== confirmPassword) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.PASSWORD_MISMATCHED, 400)
      );
    }

    const existingUser = await user.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      req.session.destroy();
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.updateOne(
      { email: email.toLowerCase() },
      { password: hashedPassword }
    );

    req.session.destroy();

    logger.info({
      message: '\n///Password reset successfully///\n',
      email,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { email: email.toLowerCase() },
      200,
      'Password reset successfully',
      res
    );
  } catch (error) {
    req.session.destroy();
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

export default {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
};
