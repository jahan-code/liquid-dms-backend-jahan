const errorConstants = {
  // 🔹 General Errors
  GENERAL: {
    INTERNAL_SERVER_ERROR:
      "An unexpected error occurred. Please try again later.",
    UNAUTHORIZED: "Access denied. Valid authentication is required.",
    INVALID_TOKEN: "Invalid or expired token. Please log in again.",
    VALIDATION_ERROR:
      "Invalid input data. Please check your request and try again.",
  },

  // 🔹 Route & Method Errors
  ROUTE_ERRORS: {
    INVALID_ROUTE: "The requested route does not exist.",
    INVALID_METHOD: "The requested method is not allowed for this route.",
  },
  // 🔹 Auth Errors
  AUTHENTICATION: {
    OTP_MUST_BE_STRING: "OTP must be a string",
    OTP_INVALID_LENGTH: "OTP must be 4 digits",
    OTP_INVALID_FORMAT: "OTP must contain only digits",
    OTP_REQUIRED: "OTP is required",
    EMAIL_ALREADY_IN_USE: "The email is already in use.",
    EMAIL_MUST_BE_STRING: "The email must be a string.",
    EMAIL_INVALID: "The email format is invalid.",
    FAILED_TO_SEND_EMAIL: "Failed to send email.",
    EMAIL_REQUIRED: "The email is required.",
    COMPANY_NAME_MUST_BE_STRING: "The company name must be a string.",
    COMPANY_NAME_REQUIRED: "The company name is required.",
    COMPANY_NAME_MIN_LENGTH: "The company name must have a minimum length.",
    COMPANY_NAME_MAX_LENGTH:
      "The company name must not exceed the maximum length.",
    NAME_MUST_BE_STRING: "The name must be a string.",
    NAME_REQUIRED: "The name is required.",
    NAME_MIN_LENGTH: "The name must have a minimum length.",
    NAME_MAX_LENGTH: "The name must not exceed the maximum length.",
    PHONE_MUST_BE_STRING: "The phone number must be a string.",
    PHONE_REQUIRED: "The phone number is required.",
    PASSWORD_MUST_BE_STRING: "The password must be a string.",
    PASSWORD_REQUIRED: "The password is required.",
    PASSWORD_MIN_LENGTH: "The password must have a minimum length.",
    PASSWORD_MAX_LENGTH: "The password must not exceed the maximum length.",
    PASSWORD_CREATE_MUST_BE_STRING: "The new password must be a string.",
    PASSWORD_CREATE_REQUIRED: "The new password is required.",
    PASSWORD_CREATE_MIN_LENGTH:
      "The new password must have a minimum length of 8 characters.",
    PASSWORD_CREATE_MAX_LENGTH:
      "The new password must not exceed 50 characters.",
    PASSWORD_CREATE_INVALID:
      "The new password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    PASSWORD_RESET_TOKEN_MUST_BE_STRING:
      "The password reset token must be a string.",
    PASSWORD_RESET_TOKEN_REQUIRED: "The password reset token is required.",
    PASSWORD_COMPLEXITY:
      "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
    ORGANIZATION_ID_MUST_BE_STRING: "The organization ID must be a string.",
    ORGANIZATION_ID_REQUIRED: "The organization ID is required.",
  },

  // 🔹 Campaign Login Template Errors
  CAMPAIGN_LOGIN_TEMPLATE: {
    NAME_REQUIRED: "The campaign login template name is required.",
    NAME_MUST_BE_STRING:
      "The campaign login template name must be a valid string.",
    NAME_MIN_LENGTH:
      "The campaign login template name must be at least 2 characters long.",
    NAME_MAX_LENGTH:
      "The campaign login template name cannot exceed 50 characters.",
    DESCRIPTION_REQUIRED:
      "The campaign login template description is required.",
    DESCRIPTION_MUST_BE_STRING:
      "The campaign login template description must be a valid string.",
    DESCRIPTION_MIN_LENGTH:
      "The campaign login template description must be at least 10 characters long.",
    DESCRIPTION_MAX_LENGTH:
      "The campaign login template description cannot exceed 500 characters.",
    IMAGE_BASE64_REQUIRED: "The campaign login template image is required.",
    IMAGE_BASE64_MUST_BE_STRING:
      "The campaign login template image must be a valid Base64-encoded string.",
    TEMPLATE_NOT_FOUND: "Campaign login template not found.",
    TEMPLATE_CREATED: "The campaign login template was successfully created.",
    TEMPLATE_DELETED: "The campaign login template was successfully deleted.",
    TEMPLATE_NAME_UNIQUE: "Template name must be unique.",
  },

  // 🔹 Campaign Domain Errors
  CAMPAIGN_DOMAIN: {
    URL_MUST_BE_STRING: "URL must be a valid string.",
    URL_REQUIRED: "URL is required.",
    URL_INVALID: "URL must be a valid URI.",
    STATUS_MUST_BE_BOOLEAN: "Status must be a boolean value.",
    ID_MUST_BE_STRING: "ID must be a valid string.",
    ID_REQUIRED: "ID is required.",
    DOMAIN_CREATED: "The domain was successfully created.",
    DOMAIN_DELETED: "The domain was successfully deleted.",
    DOMAIN_URL_UNIQUE: "Domain URL must be unique.",
    DOMAIN_NOT_FOUND: "Domain not found.",
  },

  // 🔹 Campaign Errors
  CAMPAIGN: {
    NAME_MUST_BE_STRING: "Campaign name must be a valid string.",
    NAME_REQUIRED: "Campaign name is required.",
    NAME_MIN_LENGTH: "Campaign name must be at least 2 characters long.",
    NAME_MAX_LENGTH: "Campaign name must not exceed 50 characters.",

    TITLE_MUST_BE_STRING: "Campaign title must be a valid string.",
    TITLE_REQUIRED: "Campaign title is required.",
    TITLE_MIN_LENGTH: "Campaign title must be at least 2 characters long.",
    TITLE_MAX_LENGTH: "Campaign title must not exceed 100 characters.",

    MESSAGE_MUST_BE_STRING: "Campaign message must be a valid string.",
    MESSAGE_REQUIRED: "Campaign message is required.",
    MESSAGE_MIN_LENGTH: "Campaign message must be at least 5 characters long.",
    MESSAGE_MAX_LENGTH: "Campaign message must not exceed 500 characters.",

    MESSAGE_ID_MUST_BE_STRING: "Message ID must be a valid string.",
    MESSAGE_ID_REQUIRED: "Message ID is required.",

    CREATED_DATE_MUST_BE_DATE: "Created date must be a valid date.",
    CREATED_DATE_REQUIRED: "Created date is required.",

    ORGANIZATION_ID_MUST_BE_STRING: "Organization ID must be a valid string.",
    ORGANIZATION_ID_REQUIRED: "Organization ID is required.",

    CAMPAIGN_CREATED: "Campaign created successfully.",
    CAMPAIGN_DELETED: "The domain was successfully deleted.",
    CAMPAIGN_NOT_FOUND: "Domain not found.",
  },

  // 🔹 Message Template Errors
  MESSAGE_TEMPLATE: {
    NAME_REQUIRED: "The message template name is required.",
    NAME_MUST_BE_STRING: "The message template name must be a valid string.",
    NAME_MIN_LENGTH:
      "The message template name must be at least 2 characters long.",
    NAME_MAX_LENGTH: "The message template name cannot exceed 50 characters.",

    MESSAGE_REQUIRED: "The message template message is required.",
    MESSAGE_MUST_BE_STRING:
      "The message template message must be a valid string.",
    MESSAGE_MIN_LENGTH:
      "The message template message must be at least 5 characters long.",
    MESSAGE_MAX_LENGTH:
      "The message template message cannot exceed 500 characters.",

    ORGANIZATION_ID_REQUIRED: "Organization ID is required.",
    ORGANIZATION_ID_MUST_BE_STRING: "Organization ID must be a valid string.",

    TEMPLATE_NOT_FOUND: "Message template not found.",
    TEMPLATE_CREATED: "The message template was successfully created.",
    TEMPLATE_DELETED: "The message template was successfully deleted.",

    TYPE_MUST_BE_STRING: "Type must be a string.",
    TYPE_INVALID: "Type must be either 'link' or 'text'.",
    TYPE_REQUIRED: "Type is required.",
  },

  // 🔹 user Group Errors
  USERGROUP: {
    ORGANIZATIONID_MUST_BE_STRING: "Organization ID must be a string.",
    ORGANIZATIONID_REQUIRED: "Organization ID is required.",
    NAME_MUST_BE_STRING: "Name must be a string.",
    NAME_REQUIRED: "Name is required.",
    NAME_MIN_LENGTH: "Name must be at least 2 characters long.",
    NAME_MAX_LENGTH: "Name must not exceed 50 characters.",
    USERS_MUST_BE_ARRAY: "Users must be an array.",
    USERS_MIN_LENGTH: "At least one user is required.",
    USERS_REQUIRED: "Users field is required.",
    GROUP_NOT_FOUND: "User group not found.",
    GROUP_CREATED: "The user group was successfully created.",
    GROUP_DELETED: "The user group was successfully deleted.",
  },

  // 🔹 user Group Errors
  FREEUSER: {
    NAME_MUST_BE_STRING: "Name must be a string.",
    NAME_REQUIRED: "Name is required.",
    NAME_MIN_LENGTH: "Name must be at least 2 characters long.",
    NAME_MAX_LENGTH: "Name must not exceed 50 characters.",
    COMPANYNAME_MUST_BE_STRING: "Company name must be a string.",
    COMPANYNAME_REQUIRED: "Company name is required.",
    COMPANYNAME_MIN_LENGTH: "Company name must be at least 2 characters long.",
    COMPANYNAME_MAX_LENGTH: "Company name must not exceed 100 characters.",
    DEPARTMENTS_MUST_BE_STRING: "Departments must be a string.",
    DEPARTMENTS_REQUIRED: "Departments field is required.",
    EMAIL_INVALID: "Email must be a valid email address.",
    EMAIL_REQUIRED: "Email is required.",
    PHONE_INVALID: "Phone number must be between 10 to 15 digits.",
    PHONE_REQUIRED: "Phone number is required.",
    ROLE_MUST_BE_STRING: "Role must be a string.",
    ROLE_REQUIRED: "Role is required.",
    ORGANIZATIONID_MUST_BE_STRING: "Organization ID must be a string.",
    ORGANIZATIONID_REQUIRED: "Organization ID is required.",
    GROUP_NOT_FOUND: "User  not found.",
    USER_CREATED: "The user  was successfully created.",
    USER_DELETED: "The user  was successfully deleted.",
  },
};

export default errorConstants;
