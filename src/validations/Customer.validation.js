import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Reusable Validators
const requiredString = (field) =>
  Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': errorConstants.CUSTOMER[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.CUSTOMER[`${field}_REQUIRED`],
      'any.required': errorConstants.CUSTOMER[`${field}_REQUIRED`],
    });

const optionalString = (field) =>
  Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': errorConstants.CUSTOMER[`${field}_MUST_BE_STRING`],
    });

const enumValidator = (field, values) =>
  Joi.string()
    .valid(...values)
    .messages({
      'any.only': errorConstants.CUSTOMER[`${field}_INVALID`],
    });

// 🔹 Field Validators
const emailValidator = Joi.string().email().trim().required().messages({
  'string.email': errorConstants.CUSTOMER.EMAIL_INVALID,
  'string.empty': errorConstants.CUSTOMER.EMAIL_REQUIRED,
  'any.required': errorConstants.CUSTOMER.EMAIL_REQUIRED,
});

const dateValidator = Joi.date().messages({
  'date.base': errorConstants.CUSTOMER.DATE_INVALID,
});

const booleanValidator = Joi.boolean();

const contactNumberValidator = Joi.string()
  .pattern(/^[0-9+\-()\s]{7,20}$/)
  .messages({
    'string.pattern.base': errorConstants.CUSTOMER.CONTACT_INVALID,
    'string.base': errorConstants.CUSTOMER.CONTACT_MUST_BE_STRING,
  });

// 🔹 Final Schema
export const addCustomerSchema = Joi.object({
  CustomerInformation: Joi.object({
    firstName: requiredString('FIRST_NAME'),
    middleName: optionalString('MIDDLE_NAME'),
    lastName: requiredString('LAST_NAME'),
    Street: optionalString('STREET'),
    City: requiredString('CITY'),
    State: requiredString('STATE'),
    ZipCode: requiredString('ZIPCODE'),
    Country: requiredString('COUNTRY'),
    primaryContactNumber: contactNumberValidator.required(),
    SecondaryContactNumber: optionalString('SECONDARY_CONTACT'),
    email: emailValidator,
    DateOfBirth: dateValidator.optional(),
    Gender: enumValidator('GENDER', ['Male', 'Female', 'Other']),
    SSN: optionalString('SSN'),
    DriverLicense: optionalString('DRIVER_LICENSE'),
    LicenseExpiration: dateValidator.optional(),
    SpouseName: optionalString('SPOUSE_NAME'),
    vehicleUse: optionalString('VEHICLE_USE'),
    isHomeOwner: booleanValidator.default(false),
    hearAboutUs: enumValidator('HEAR_ABOUT_US', [
      'Facebook',
      'Twitter',
      'Other',
    ]),
    hearAboutUsOther: Joi.when('hearAboutUs', {
      is: 'Other',
      then: Joi.string().trim().required().messages({
        'string.base':
          errorConstants.CUSTOMER.HEAR_ABOUT_US_OTHER_MUST_BE_STRING,
        'string.empty': errorConstants.CUSTOMER.HEAR_ABOUT_US_OTHER_REQUIRED,
        'any.required': errorConstants.CUSTOMER.HEAR_ABOUT_US_OTHER_REQUIRED,
      }),
      otherwise: Joi.string().allow('', null).optional(),
    }),
  }).required(),
  IncomeInformation: Joi.object({
    EmploymentStatus: enumValidator('EMPLOYMENT_STATUS', [
      'Employed Full-Time',
      'Employed Part-Time',
      'Self-Employed',
      'Unemployed',
      'Retired',
      'Student',
    ]).required(),
    EmploymentLenght: optionalString('EMPLOYMENT_LENGTH'),
    GrossMonthlyIncome: Joi.number().required().messages({
      'number.base': 'Gross monthly income must be a number.',
      'any.required': 'Gross monthly income is required.',
    }),
    preferredMethodOfIncomeVerification: enumValidator(
      'PREFERRED_METHOD_OF_INCOME_VERIFICATION',
      ['Pay Stub', 'Bank Statement', 'Tax Return', 'Verbal Confirmation']
    ).required(),
    EmploymentType: optionalString('EMPLOYMENT_TYPE'),
  }).required(),
}).required();
// inside Customer.validation.js
const customerInfoSchema = addCustomerSchema.extract('CustomerInformation');
const optionalCustomerInfoSchema = customerInfoSchema.fork(
  Object.keys(customerInfoSchema.describe().keys),
  (field) => field.optional()
);

const incomeInfoSchema = addCustomerSchema.extract('IncomeInformation');
const optionalIncomeInfoSchema = incomeInfoSchema.fork(
  Object.keys(incomeInfoSchema.describe().keys),
  (field) => field.optional()
);

// Step 3: Wrap back into the main schema
export const editCustomerSchema = Joi.object({
  CustomerInformation: optionalCustomerInfoSchema,
  IncomeInformation: optionalIncomeInfoSchema,
});
