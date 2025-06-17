const errorConstants = {
  // 🔹 General Errors
  GENERAL: {
    INTERNAL_SERVER_ERROR:
      'An unexpected error occurred. Please try again later.',
    UNAUTHORIZED: 'Access denied. Valid authentication is required.',
    INVALID_TOKEN: 'Invalid or expired token. Please log in again.',
    VALIDATION_ERROR:
      'Invalid input data. Please check your request and try again.',
  },

  // 🔹 Route & Method Errors
  ROUTE_ERRORS: {
    INVALID_ROUTE: 'The requested route does not exist.',
    INVALID_METHOD: 'The requested method is not allowed for this route.',
  },
  // 🔹 Auth Errors
  AUTHENTICATION: {
    TOKEN_INVALID: 'Invalid token. Please log in again.',
    TOKEN_MISSING: 'Token missing. Please log in again.',
    UNKNOWN_CONTEXT: 'Unknown OTP context.',
    SESSION_EXPIRED: 'Session expired.',
    USER_ALREADY_EXISTS: 'User already exists.',
    DATA_NOT_FOUND: 'Data not found.',
    INVALID_OTP_CONTEXT_FOR_RESET: 'Invalid OTP context for reset password.',
    OTP_MUST_BE_STRING: 'OTP must be a string',
    OTP_INVALID_LENGTH: 'OTP must be 4 digits',
    OTP_INVALID_FORMAT: 'OTP must contain only digits',
    OTP_REQUIRED: 'OTP is required',
    USER_NOT_VERIFIED: 'User not verified. Please verify your email first.',
    USER_NOT_FOUND: 'User not found.',
    EMAIL_ALREADY_IN_USE: 'The email is already in use.',
    EMAIL_MUST_BE_STRING: 'The email must be a string.',
    EMAIL_INVALID: 'The email format is invalid.',
    FAILED_TO_SEND_EMAIL: 'Failed to send email.',
    EMAIL_REQUIRED: 'The email is required.',
    COMPANY_NAME_MUST_BE_STRING: 'The company name must be a string.',
    COMPANY_NAME_REQUIRED: 'The company name is required.',
    COMPANY_NAME_MIN_LENGTH: 'The company name must have a minimum length.',
    COMPANY_NAME_MAX_LENGTH:
      'The company name must not exceed the maximum length.',
    NAME_MUST_BE_STRING: 'The name must be a string.',
    NAME_REQUIRED: 'The name is required.',
    NAME_MIN_LENGTH: 'The name must have a minimum length.',
    NAME_MAX_LENGTH: 'The name must not exceed the maximum length.',
    PHONE_MUST_BE_STRING: 'The phone number must be a string.',
    PHONE_REQUIRED: 'The phone number is required.',
    PASSWORD_MUST_BE_STRING: 'The password must be a string.',
    PASSWORD_REQUIRED: 'The password is required.',
    PASSWORD_MIN_LENGTH: 'The password must have a minimum length.',
    PASSWORD_MAX_LENGTH: 'The password must not exceed the maximum length.',
    PASSWORD_CREATE_MUST_BE_STRING: 'The new password must be a string.',
    PASSWORD_CREATE_REQUIRED: 'The new password is required.',
    PASSWORD_MISMATCHED: 'The new password and confirm password do not match.',
    PASSWORD_CREATE_MIN_LENGTH:
      'The new password must have a minimum length of 8 characters.',
    PASSWORD_CREATE_MAX_LENGTH:
      'The new password must not exceed 50 characters.',
    PASSWORD_CREATE_INVALID:
      'The new password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
    PASSWORD_RESET_TOKEN_MUST_BE_STRING:
      'The password reset token must be a string.',
    PASSWORD_RESET_TOKEN_REQUIRED: 'The password reset token is required.',
    PASSWORD_COMPLEXITY:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
    ORGANIZATION_ID_MUST_BE_STRING: 'The organization ID must be a string.',
    ORGANIZATION_ID_REQUIRED: 'The organization ID is required.',
  },

  // 🔹 Campaign Login Template Errors
  CAMPAIGN_LOGIN_TEMPLATE: {
    NAME_REQUIRED: 'The campaign login template name is required.',
    NAME_MUST_BE_STRING:
      'The campaign login template name must be a valid string.',
    NAME_MIN_LENGTH:
      'The campaign login template name must be at least 2 characters long.',
    NAME_MAX_LENGTH:
      'The campaign login template name cannot exceed 50 characters.',
    DESCRIPTION_REQUIRED:
      'The campaign login template description is required.',
    DESCRIPTION_MUST_BE_STRING:
      'The campaign login template description must be a valid string.',
    DESCRIPTION_MIN_LENGTH:
      'The campaign login template description must be at least 10 characters long.',
    DESCRIPTION_MAX_LENGTH:
      'The campaign login template description cannot exceed 500 characters.',
    IMAGE_BASE64_REQUIRED: 'The campaign login template image is required.',
    IMAGE_BASE64_MUST_BE_STRING:
      'The campaign login template image must be a valid Base64-encoded string.',
    TEMPLATE_NOT_FOUND: 'Campaign login template not found.',
    TEMPLATE_CREATED: 'The campaign login template was successfully created.',
    TEMPLATE_DELETED: 'The campaign login template was successfully deleted.',
    TEMPLATE_NAME_UNIQUE: 'Template name must be unique.',
  },

  VENDOR: {
    // Category
    EMAIL_ALREADY_EXISTS: 'Email already exists.',
    ZIP_INVALID_FORMAT: 'ZIP code must be 5 digits (e.g., 90210)',
    ADDRESS_REQUIRED: 'Address is required.',
    NAME_REQUIRED: 'Name is required.',
    CATEGORY_REQUIRED: 'Category is required.',
    CATEGORY_MUST_BE_STRING: 'Category must be a string.',

    // Name
    NAME_MUST_BE_STRING: 'Name must be a string.',

    // Street
    STREET_MUST_BE_STRING: 'Street must be a string.',

    // ZIP
    ZIP_MUST_BE_STRING: 'ZIP must be a string.',

    // City
    CITY_MUST_BE_STRING: 'City must be a string.',

    // State
    STATE_REQUIRED: 'State is required.',
    STATE_MUST_BE_STRING: 'State must be a string.',
    STATE_INVALID:
      'State must be one of the allowed values: Alabama, Alaska, Arizona, Arkansas, California.',

    // Phone
    PHONE_MUST_BE_STRING: 'Phone must be a string.',
    OTHER_PHONE_MUST_BE_STRING: 'Other Phone must be a string.',

    // Contact Person
    CONTACT_PERSON_MUST_BE_STRING: 'Contact person must be a string.',

    // Email
    EMAIL_REQUIRED: 'Email is required.',
    EMAIL_MUST_BE_STRING: 'Email must be a string.',
    EMAIL_INVALID: 'Email must be a valid email address.',

    // Account Number
    ACCOUNT_NUMBER_MUST_BE_STRING: 'Account number must be a string.',

    // Name on Check
    NAME_ON_CHECK_MUST_BE_STRING: 'Name to print on check must be a string.',

    // Tax ID / SSN
    TAX_ID_REQUIRED: 'Tax ID or SSN is required.',
    TAX_ID_MUST_BE_STRING: 'Tax ID or SSN must be a string.',

    // Payment Terms
    PAYMENT_TERMS_MUST_BE_STRING: 'Payment terms must be a string.',

    // Note
    NOTE_MUST_BE_STRING: 'Note must be a string.',
  },

  // 🔹 Message Template Errors
  MESSAGE_TEMPLATE: {
    NAME_REQUIRED: 'The message template name is required.',
    NAME_MUST_BE_STRING: 'The message template name must be a valid string.',
    NAME_MIN_LENGTH:
      'The message template name must be at least 2 characters long.',
    NAME_MAX_LENGTH: 'The message template name cannot exceed 50 characters.',

    MESSAGE_REQUIRED: 'The message template message is required.',
    MESSAGE_MUST_BE_STRING:
      'The message template message must be a valid string.',
    MESSAGE_MIN_LENGTH:
      'The message template message must be at least 5 characters long.',
    MESSAGE_MAX_LENGTH:
      'The message template message cannot exceed 500 characters.',

    ORGANIZATION_ID_REQUIRED: 'Organization ID is required.',
    ORGANIZATION_ID_MUST_BE_STRING: 'Organization ID must be a valid string.',

    TEMPLATE_NOT_FOUND: 'Message template not found.',
    TEMPLATE_CREATED: 'The message template was successfully created.',
    TEMPLATE_DELETED: 'The message template was successfully deleted.',

    TYPE_MUST_BE_STRING: 'Type must be a string.',
    TYPE_INVALID: "Type must be either 'link' or 'text'.",
    TYPE_REQUIRED: 'Type is required.',
  },

  // 🔹 user Group Errors
  USERGROUP: {
    ORGANIZATIONID_MUST_BE_STRING: 'Organization ID must be a string.',
    ORGANIZATIONID_REQUIRED: 'Organization ID is required.',
    NAME_MUST_BE_STRING: 'Name must be a string.',
    NAME_REQUIRED: 'Name is required.',
    NAME_MIN_LENGTH: 'Name must be at least 2 characters long.',
    NAME_MAX_LENGTH: 'Name must not exceed 50 characters.',
    USERS_MUST_BE_ARRAY: 'Users must be an array.',
    USERS_MIN_LENGTH: 'At least one user is required.',
    USERS_REQUIRED: 'Users field is required.',
    GROUP_NOT_FOUND: 'User group not found.',
    GROUP_CREATED: 'The user group was successfully created.',
    GROUP_DELETED: 'The user group was successfully deleted.',
  },

  // 🔹 user Group Errors
  FREEUSER: {
    NAME_MUST_BE_STRING: 'Name must be a string.',
    NAME_REQUIRED: 'Name is required.',
    NAME_MIN_LENGTH: 'Name must be at least 2 characters long.',
    NAME_MAX_LENGTH: 'Name must not exceed 50 characters.',
    COMPANYNAME_MUST_BE_STRING: 'Company name must be a string.',
    COMPANYNAME_REQUIRED: 'Company name is required.',
    COMPANYNAME_MIN_LENGTH: 'Company name must be at least 2 characters long.',
    COMPANYNAME_MAX_LENGTH: 'Company name must not exceed 100 characters.',
    DEPARTMENTS_MUST_BE_STRING: 'Departments must be a string.',
    DEPARTMENTS_REQUIRED: 'Departments field is required.',
    EMAIL_INVALID: 'Email must be a valid email address.',
    EMAIL_REQUIRED: 'Email is required.',
    PHONE_INVALID: 'Phone number must be between 10 to 15 digits.',
    PHONE_REQUIRED: 'Phone number is required.',
    ROLE_MUST_BE_STRING: 'Role must be a string.',
    ROLE_REQUIRED: 'Role is required.',
    ORGANIZATIONID_MUST_BE_STRING: 'Organization ID must be a string.',
    ORGANIZATIONID_REQUIRED: 'Organization ID is required.',
    GROUP_NOT_FOUND: 'User  not found.',
    USER_CREATED: 'The user  was successfully created.',
    USER_DELETED: 'The user  was successfully deleted.',
  },
};

export default errorConstants;
