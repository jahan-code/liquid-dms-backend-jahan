import Joi from 'joi';

// Combined Profile Update Schema (handles both profile and password)
export const updateProfileAndPasswordSchema = Joi.object({
  // Profile fields
  fullname: Joi.string().trim().min(2).max(50).optional().messages({
    'string.empty': 'Full name cannot be empty',
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 50 characters',
  }),
  email: Joi.string().email().trim().optional().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email cannot be empty',
  }),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional().messages({
    'any.only': 'Gender must be Male, Female, or Other',
  }),
  phone: Joi.string().trim().optional().messages({
    'string.empty': 'Phone number cannot be empty',
  }),
  address: Joi.string().trim().optional().messages({
    'string.empty': 'Address cannot be empty',
  }),
  zipCode: Joi.string().trim().optional().messages({
    'string.empty': 'ZIP code cannot be empty',
  }),
  language: Joi.string().trim().optional().messages({
    'string.empty': 'Language cannot be empty',
  }),
  profileImage: Joi.string().trim().allow('', null).optional().messages({
    'string.empty': 'Profile image can be empty',
  }),

  // Password fields (all optional - only validate if provided)
  currentPassword: Joi.string().trim().optional().messages({
    'string.empty': 'Current password cannot be empty',
  }),
  newPassword: Joi.string()
    .trim()
    .min(6)
    .max(50)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/)
    .optional()
    .messages({
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 50 characters',
      'string.pattern.base':
        'New password must contain at least one lowercase letter, one uppercase letter, and one special character',
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .optional()
    .messages({
      'any.only': 'Confirm password must match new password',
    }),
}).custom((value, helpers) => {
  // Custom validation: if any password field is provided, all must be provided
  const hasCurrentPassword = !!value.currentPassword;
  const hasNewPassword = !!value.newPassword;
  const hasConfirmPassword = !!value.confirmNewPassword;

  if (hasCurrentPassword || hasNewPassword || hasConfirmPassword) {
    if (!hasCurrentPassword) {
      return helpers.error('any.invalid', {
        message: 'Current password is required when changing password',
      });
    }
    if (!hasNewPassword) {
      return helpers.error('any.invalid', {
        message: 'New password is required when changing password',
      });
    }
    if (!hasConfirmPassword) {
      return helpers.error('any.invalid', {
        message: 'Confirm password is required when changing password',
      });
    }
  }
  return value;
});

// Get Profile Schema (for validation if needed)
export const getProfileSchema = Joi.object({
  // No body validation needed for GET requests
});
