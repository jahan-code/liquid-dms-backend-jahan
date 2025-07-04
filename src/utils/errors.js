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
    INVALID_CREDENTIALS: 'Invalid email or password.',
    OTP_NOT_VERIFIED: 'Please verify your OTP before proceeding.',
    INVALID_OTP: 'Invalid OTP.',
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
    USER_NOT_VERIFIED: 'Please verify your email first.',
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

  //// 🔹 Vehicle Validation Errors
  //
  VEHICLE: {
    // 🔹 Basic Details
    NOTE_CATEGORY_INVALID: 'Note category is invalid.',
    MAKE_MUST_BE_STRING: 'Make must be a string.',
    MAKE_REQUIRED: 'Make is required.',
    MODEL_MUST_BE_STRING: 'Model must be a string.',
    MODEL_REQUIRED: 'Model is required.',
    TYPE_MUST_BE_STRING: 'Vehicle type must be a string.',
    TYPE_REQUIRED: 'Vehicle type is required.',
    VEHICLE_TITLE_MUST_BE_STRING: 'Vehicle title must be a string.',
    VEHICLE_TITLE_REQUIRED: 'Vehicle title is required.',
    VIN_MUST_BE_STRING: 'VIN must be a string.',
    VIN_REQUIRED: 'VIN is required.',
    TITLE_APPLICATION_MUST_BE_STRING: 'Title application must be a string.',
    TITLE_APPLICATION_REQUIRED: 'Title application is required.',

    // 🔹 Location & Address
    STREET_MUST_BE_STRING: 'Street must be a string.',
    STREET_REQUIRED: 'Street is required.',
    ZIP_MUST_BE_STRING: 'ZIP must be a string.',
    ZIP_REQUIRED: 'ZIP code is required.',
    CITY_MUST_BE_STRING: 'City must be a string.',
    CITY_REQUIRED: 'City is required.',
    STATE_INVALID: 'State is invalid.',
    COUNTRY_INVALID: 'Country is invalid.',
    STYLE_MUST_BE_STRING: 'Style must be a string.',
    STYLE_REQUIRED: 'Style is required.',
    BODY_TYPE_MUST_BE_STRING: 'Body type must be a string.',
    BODY_TYPE_REQUIRED: 'Body type is required.',
    YEAR_MUST_BE_STRING: 'Year must be a string.',
    YEAR_REQUIRED: 'Year is required.',
    CONDITION_MUST_BE_STRING: 'Condition must be a string.',
    CONDITION_REQUIRED: 'Condition is required.',
    CERTIFIED_MUST_BE_STRING: 'Certified must be a string.',
    CERTIFIED_REQUIRED: 'Certified is required.',
    TRAN_SPEED_MUST_BE_STRING: 'Transmission speed must be a string.',
    TRAN_SPEED_REQUIRED: 'Transmission speed is required.',
    DRIVETRAIN_MUST_BE_STRING: 'Drivetrain must be a string.',
    DRIVETRAIN_REQUIRED: 'Drivetrain is required.',
    CYLINDERS_MUST_BE_STRING: 'Cylinders must be a string.',
    CYLINDERS_REQUIRED: 'Cylinders are required.',
    ENGINE_SIZE_MUST_BE_STRING: 'Engine size must be a string.',
    ENGINE_SIZE_REQUIRED: 'Engine size is required.',
    FUEL_TYPE_MUST_BE_STRING: 'Fuel type must be a string.',
    FUEL_TYPE_REQUIRED: 'Fuel type is required.',
    MPG_MUST_BE_STRING: 'MPG must be a string.',
    MPG_REQUIRED: 'MPG is required.',
    TOW_CAPACITY_MUST_BE_STRING: 'Tow capacity must be a string.',
    TOW_CAPACITY_REQUIRED: 'Tow capacity is required.',
    PASSENGERS_MUST_BE_STRING: 'Passenger count must be a string.',
    PASSENGERS_REQUIRED: 'Passenger count is required.',
    MILEAGE_MUST_BE_STRING: 'Mileage must be a string.',
    MILEAGE_REQUIRED: 'Mileage is required.',
    MILEAGE_STATUS_MUST_BE_STRING: 'Mileage status must be a string.',
    MILEAGE_STATUS_REQUIRED: 'Mileage status is required.',
    COLOR_MUST_BE_STRING: 'Color must be a string.',
    COLOR_REQUIRED: 'Color is required.',
    INTERIOR_COLOR_MUST_BE_STRING: 'Interior color must be a string.',
    INTERIOR_COLOR_REQUIRED: 'Interior color is required.',
    COLOR_DESCRIPTION_REQUIRED: 'Color description is required.',
    TAG_REQUIRED: 'Tag is required.',
    DECAL_REQUIRED: 'Decal is required.',
    GPS_SERIAL_REQUIRED: 'GPS serial is required.',
    TITLE_IN_MUST_BE_STRING: 'Title in must be a string.',
    STATE_TITLE_IN_REQUIRED: 'State title in is required.',
    TITLE_REQUIRED: 'Title is required.',
    INSPECTION_NUMBER_REQUIRED: 'Inspection number is required.',
    INSPECTED_BY_REQUIRED: 'Inspected by is required.',
    WARRANTY_MUST_BE_STRING: 'Warranty must be a string.',
    WARRANTY_REQUIRED: 'Warranty is required.',
    IGNITION_KEY_CODE_REQUIRED: 'Ignition key code is required.',
    DOOR_KEY_CODE_REQUIRED: 'Door key code is required.',
    VALET_KEY_CODE_REQUIRED: 'Valet key code is required.',
    ACCOUNT_NUMBER_REQUIRED: 'Account number is required.',
    NOTES_REQUIRED: 'Notes are required.',
    BILL_OF_SALES_REQUIRED: 'Bill of sales is required.',

    // 🔹 Previous Owner
    OWNER_NAME_MUST_BE_STRING: 'Owner name must be a string.',
    OWNERSHIP_TYPE_INVALID: 'Ownership type is invalid.',
    CONTACT_NUMBER_MUST_BE_STRING: 'Contact number must be a string.',
    ADDRESS_MUST_BE_STRING: 'Address must be a string.',
    STATE_OF_REGISTRATION_MUST_BE_STRING:
      'State of registration must be a string.',
    STATE_OF_REGISTRATION_INVALID: 'State of registration is invalid.',
    PRINCIPLE_USE_OF_VEHICLE_MUST_BE_STRING:
      'Principle use of vehicle must be a string.',
    // 🔹 Contact
    PRIMARY_CONTACT_NUMBER_MUST_BE_STRING:
      'Primary contact number must be a string.',
    PRIMARY_CONTACT_NUMBER_REQUIRED: 'Primary contact number is required.',
    CONTACT_PERSON_MUST_BE_STRING: 'Contact person must be a string.',
    CONTACT_PERSON_REQUIRED: 'Contact person is required.',
    ALTERNATIVE_CONTACT_NUMBER_MUST_BE_STRING:
      'Alternative contact number must be a string.',
    ALTERNATIVE_CONTACT_NUMBER_REQUIRED:
      'Alternative contact number is required.',
    EMAIL_MUST_BE_STRING: 'Email must be a string.',
    EMAIL_REQUIRED: 'Email is required.',

    EMAIL_INVALID: 'Vendor email must be a valid email.',

    // 🔹 Vendor

    VENDOR_ID_MUST_BE_STRING: 'Vendor ID must be a string.',
    VENDOR_ID_REQUIRED: 'Vendor ID is required.',
    VENDOR_ID_INVALID: 'Vendor ID is invalid.',
    CATEGORY_MUST_BE_STRING: 'Category must be a string.',
    CATEGORY_REQUIRED: 'Category is required.',
    NAME_MUST_BE_STRING: 'Name must be a string.',
    NAME_REQUIRED: 'Name is required.',
    TAX_ID_OR_SSN_MUST_BE_STRING: 'Tax ID or SSN must be a string.',
    TAX_ID_OR_SSN_REQUIRED: 'Tax ID or SSN is required.',
    BILL_OF_SALES_MUST_BE_STRING: 'Bill of sales must be a string.',
    ACCOUNT_NUMBER_MUST_BE_STRING: 'Account number must be a string.',
    NOTES_MUST_BE_STRING: 'Notes must be a string.',

    // 🔹 Specifications
    STYLE_INVALID: 'Style is invalid.',
    BODY_TYPE_INVALID: 'Body type is invalid.',
    YEAR_MUST_BE_NUMBER: 'Year must be a number.',
    YEAR_TOO_OLD: 'Year is too old.',
    YEAR_TOO_NEW: 'Year is too new.',
    YEAR_INTEGER: 'Year must be an integer.',
    CONDITION_INVALID: 'Condition is invalid.',
    CERTIFIED_INVALID: 'Certified value is invalid.',
    TRANSMISSION_INVALID: 'Transmission type is invalid.',
    TRAN_SPEED_MUST_BE_NUMBER: 'Transmission speed must be a number.',
    TRAN_SPEED_TOO_LOW: 'Transmission speed too low.',
    TRAN_SPEED_TOO_HIGH: 'Transmission speed too high.',
    TRAN_SPEED_INTEGER: 'Transmission speed must be an integer.',
    DRIVETRAIN_INVALID: 'Drivetrain is invalid.',
    CYLINDERS_MUST_BE_NUMBER: 'Engine cylinders must be a number.',
    CYLINDERS_TOO_LOW: 'Engine cylinders too low.',
    CYLINDERS_TOO_HIGH: 'Engine cylinders too high.',
    CYLINDERS_INTEGER: 'Engine cylinders must be an integer.',
    ENGINE_SIZE_INVALID: 'Engine size must be in format like "2.5L".',
    FUEL_TYPE_INVALID: 'Fuel type is invalid.',
    MPG_MUST_BE_NUMBER: 'MPG must be a number.',
    MPG_NEGATIVE: 'MPG cannot be negative.',
    TOW_CAPACITY_INVALID: 'Tow capacity format is invalid (e.g., "5,000 lbs").',
    PASSENGERS_MUST_BE_NUMBER: 'Passengers must be a number.',
    PASSENGERS_TOO_LOW: 'Too few passengers.',
    PASSENGERS_TOO_HIGH: 'Too many passengers.',
    PASSENGERS_INTEGER: 'Passengers must be an integer.',
    MILEAGE_MUST_BE_NUMBER: 'Mileage must be a number.',
    MILEAGE_NEGATIVE: 'Mileage cannot be negative.',
    MILEAGE_STATUS_INVALID: 'Mileage status is invalid.',

    // 🔹 Colors
    COLOR_INVALID: 'Color is invalid.',
    INTERIOR_COLOR_INVALID: 'Interior color is invalid.',
    COLOR_DESCRIPTION_MUST_BE_STRING: 'Color description must be a string.',
    TAG_MUST_BE_STRING: 'Tag must be a string.',
    DECAL_MUST_BE_STRING: 'Decal must be a string.',
    GPS_SERIAL_MUST_BE_STRING: 'GPS serial must be a string.',

    // 🔹 Title & Inspection
    TITLE_IN_MUST_BE_BOOLEAN: 'Title in must be a boolean.',
    TITLE_IN_REQUIRED: 'Title in is required.',
    STATE_TITLE_IN_MUST_BE_STRING: 'State title in must be a string.',
    TITLE_MUST_BE_STRING: 'Title must be a string.',
    TITLE_DATE_INVALID: 'Title date is invalid.',
    INSPECTED_MUST_BE_BOOLEAN: 'Inspected must be a boolean.',
    INSPECTED_REQUIRED: 'Inspected is required.',
    INSPECTION_NUMBER_MUST_BE_STRING: 'Inspection number must be a string.',
    INSPECTION_DATE_INVALID: 'Inspection date is invalid.',
    INSPECTED_BY_MUST_BE_STRING: 'Inspected by must be a string.',
    WARRANTY_INVALID: 'Warranty value is invalid.',
    STARTER_INTERRUPT_MUST_BE_BOOLEAN: 'Starter interrupt must be boolean.',
    IGNITION_KEY_CODE_MUST_BE_STRING: 'Ignition key code must be a string.',
    DOOR_KEY_CODE_MUST_BE_STRING: 'Door key code must be a string.',
    VALET_KEY_CODE_MUST_BE_STRING: 'Valet key code must be a string.',
    MILEAGE_INVALID: 'Mileage must be one of the allowed values.',
    // 🔹 Media
    ID_INVALID_LENGTH: 'ID must be 24 characters long.',
    ID_INVALID_FORMAT: 'ID must be a valid hex string.',
    ID_MUST_BE_STRING: 'ID must be a string.',
    ID_REQUIRED: 'ID is required.',
    FEATURED_IMAGE_URL_MUST_BE_STRING: 'Featured image URL must be a string.',
    FEATURED_IMAGE_URL_REQUIRED: 'Featured image URL is required.',
    IMAGE_URL_INVALID: 'Image URL is invalid.',
    IMAGE_URLS_MUST_BE_ARRAY: 'Image URLs must be an array.',
    NOTE_CATEGORY_MUST_BE_STRING: 'Note category must be a string.',
    NOTE_TITLE_MUST_BE_STRING: 'Note title must be a string.',
    NOTE_DETAILS_MUST_BE_STRING: 'Note details must be a string.',

    // 🔹 Misc
    FEATURES_MUST_BE_ARRAY: 'Features must be an array.',
  },
  //🔹 Campaign Login Template Errors
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
    AT_LEAST_ONE_FIELD_REQUIRED: 'At least one field is required to update',
    FIELD_REQUIRED: 'This field cannot be empty if provided',
    STREET_MUST_BE_STRING: 'Street must be a string.',
    VENDOR_ID_REQUIRED: 'Vendor ID is required',
    VENDOR_NOT_FOUND: 'Vendor not found.',
    EMAIL_ALREADY_EXISTS: 'Email already exists.',
    ZIP_INVALID_FORMAT: 'ZIP code must be 5 digits (e.g., 90210)',

    ADDRESS_REQUIRED: 'Address is required.',
    NAME_REQUIRED: 'Name is required.',
    CATEGORY_REQUIRED: 'Category is required.',
    CATEGORY_MUST_BE_STRING: 'Category must be a string.',
    PRIMARY_CONTACT_NUMBER_REQUIRED: 'Primary contact number is required.',
    // Name
    NAME_MUST_BE_STRING: 'Name must be a string.',

    // Street
    STREET_REQUIRED: 'Street is required.',

    // ZIP
    ZIP_MUST_BE_STRING: 'ZIP must be a string.',
    ZIP_REQUIRED: 'ZIP code is required.',

    // City
    CITY_MUST_BE_STRING: 'City must be a string.',
    CITY_REQUIRED: 'City is required.',
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
    CONTACT_PERSON_REQUIRED: 'Contact person is required.',
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
    BILL_OF_SALES_MUST_BE_STRING: 'Bill of sales must be a string.',
  },
  FLOOR_PLAN: {
    // 🔹 Company Details
    FLOOR_PLAN_NOT_FOUND: 'Floor plan not found.',
    COMPANY_ALREADY_EXISTS:
      'A floor plan with this company name already exists.',
    FEE_NEGATIVE: ' Fee cannot be negative.',
    FEE_MUST_BE_NUMBER: ' Fee must be a number.',
    COMPANY_NAME_MUST_BE_STRING: 'Company name must be a string.',
    COMPANY_NAME_REQUIRED: 'Company name is required.',
    STREET_MUST_BE_STRING: 'Street must be a string.',
    STREET_REQUIRED: 'Street is required.',
    CITY_MUST_BE_STRING: 'City must be a string.',
    CITY_REQUIRED: 'City is required.',
    STATE_MUST_BE_STRING: 'State must be a string.',
    STATE_REQUIRED: 'State is required.',
    ZIP_MUST_BE_STRING: 'ZIP code must be a string.',
    ZIP_REQUIRED: 'ZIP code is required.',

    // 🔹 Rate
    APR_MUST_BE_NUMBER: 'APR must be a number.',
    APR_TOO_LOW: 'APR cannot be negative.',
    APR_TOO_HIGH: 'APR cannot exceed 100%.',
    INTEREST_DAYS_MUST_BE_NUMBER: 'Interest calculation days must be a number.',
    INTEREST_DAYS_TOO_LOW: 'Interest calculation days must be at least 1.',
    INTEREST_DAYS_TOO_HIGH: 'Interest calculation days cannot exceed 365.',
    INTEREST_DAYS_INTEGER: 'Interest calculation days must be an integer.',

    // 🔹 Fees
    FEES_TYPE_MUST_BE_STRING: 'Fees type must be a string.',
    FEES_TYPE_INVALID:
      'Fees type must be either "One Time" or "Plus for each Curtailment".',
    FEES_TYPE_REQUIRED: 'Fees type is required.',
    ADMIN_FEE_MUST_BE_NUMBER: 'Admin fee must be a number.',
    ADMIN_FEE_NEGATIVE: 'Admin fee cannot be negative.',
    SET_UP_FEE_MUST_BE_NUMBER: 'Setup fee must be a number.',
    SET_UP_FEE_NEGATIVE: 'Setup fee cannot be negative.',
    ADDITIONAL_FEE_MUST_BE_NUMBER: 'Additional fee must be a number.',
    ADDITIONAL_FEE_NEGATIVE: 'Additional fee cannot be negative.',

    // 🔹 Term
    TERM_LENGTH_MUST_BE_NUMBER: 'Term length must be a number.',
    TERM_LENGTH_TOO_LOW: 'Term length cannot be negative.',
    TERM_LENGTH_INTEGER: 'Term length must be an integer.',
    DAYS_UNTIL_FIRST_CURT_MUST_BE_NUMBER:
      'Days until first curtailment must be a number.',
    DAYS_UNTIL_FIRST_CURT_TOO_LOW:
      'Days until first curtailment cannot be negative.',
    DAYS_UNTIL_FIRST_CURT_INTEGER:
      'Days until first curtailment must be an integer.',
    PERCENT_REDUCTION_MUST_BE_NUMBER:
      'Percent principal reduction must be a number.',
    PERCENT_REDUCTION_TOO_LOW:
      'Percent principal reduction cannot be negative.',
    PERCENT_REDUCTION_TOO_HIGH:
      'Percent principal reduction cannot exceed 100%.',
    DAYS_UNTIL_SECOND_CURT_MUST_BE_NUMBER:
      'Days until second curtailment must be a number.',
    DAYS_UNTIL_SECOND_CURT_TOO_LOW:
      'Days until second curtailment cannot be negative.',
    DAYS_UNTIL_SECOND_CURT_INTEGER:
      'Days until second curtailment must be an integer.',
    PERCENT_REDUCTION2_MUST_BE_NUMBER:
      'Second percent principal reduction must be a number.',
    PERCENT_REDUCTION2_TOO_LOW:
      'Second percent principal reduction cannot be negative.',
    PERCENT_REDUCTION2_TOO_HIGH:
      'Second percent principal reduction cannot exceed 100%.',
    INTEREST_AND_FEES_MUST_BE_BOOLEAN:
      'Interest and fees with each curtailment must be a boolean.',

    // 🔹 Additional Notes
    ADDITIONAL_NOTES_MUST_BE_STRING: 'Additional notes must be a string.',

    // 🔹 General
    FLOOR_PLAN_CREATED: 'Floor plan created successfully.',
    FLOOR_PLAN_UPDATED: 'Floor plan updated successfully.',
    FLOOR_PLAN_DELETED: 'Floor plan deleted successfully.',
    COMPANY_DETAILS_REQUIRED: 'Company details are required.',
    RATE_REQUIRED: 'Rate details are required.',
    FEES_REQUIRED: 'Fees details are required.',
    TERM_REQUIRED: 'Term details are required.',
  },
  // 🔹 Message Template Errors
  MESSAGE_TEMPLATE: {
    FEE_MUST_BE_NUMBER: 'Fee must be a number.',
    FEE_NEGATIVE: 'Fee cannot be negative.',
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
