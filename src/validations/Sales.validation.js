import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Reusable Validators
const requiredString = (field) =>
  Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': errorConstants.SALES[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.SALES[`${field}_REQUIRED`],
      'any.required': errorConstants.SALES[`${field}_REQUIRED`],
    });

const optionalString = (field) =>
  Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': errorConstants.SALES[`${field}_MUST_BE_STRING`],
    });

const enumValidator = (field, values) =>
  Joi.string()
    .valid(...values)
    .messages({
      'any.only': errorConstants.SALES[`${field}_INVALID`],
    });

// 🔹 Customer Information Validators
const customerInfoSchema = Joi.object({
  isExistingCustomer: Joi.boolean().required(),
  customerId: Joi.when('isExistingCustomer', {
    is: true,
    then: Joi.string().required().messages({
      'string.base': errorConstants.SALES.CUSTOMER_ID_MUST_BE_STRING,
      'string.empty': errorConstants.SALES.CUSTOMER_ID_REQUIRED,
      'any.required': errorConstants.SALES.CUSTOMER_ID_REQUIRED,
    }),
    otherwise: Joi.forbidden(),
  }),
  CustomerInformation: Joi.when('isExistingCustomer', {
    is: false,
    then: Joi.object({
      firstName: requiredString('FIRST_NAME'),
      middleName: optionalString('MIDDLE_NAME'),
      lastName: requiredString('LAST_NAME'),
      Street: requiredString('STREET'),
      City: requiredString('CITY'),
      State: requiredString('STATE'),
      ZipCode: requiredString('ZIP_CODE'),
      Country: optionalString('COUNTRY'),
      primaryContactNumber: requiredString('PRIMARY_CONTACT_NUMBER'),
      SecondaryContactNumber: optionalString('SECONDARY_CONTACT_NUMBER'),
      email: Joi.string().email().required().messages({
        'string.email': errorConstants.SALES.EMAIL_INVALID,
        'any.required': errorConstants.SALES.EMAIL_REQUIRED,
      }),
      DateOfBirth: Joi.date().optional(),
      Gender: enumValidator('GENDER', ['Male', 'Female', 'Other']),
      SSN: optionalString('SSN'),
      DriverLicense: optionalString('DRIVER_LICENSE'),
      LicenseExpiration: Joi.date().optional(),
      SpouseName: optionalString('SPOUSE_NAME'),
      vehicleUse: optionalString('VEHICLE_USE'),
      isHomeOwner: Joi.boolean().default(false),
      hearAboutUs: enumValidator('HEAR_ABOUT_US', [
        'Facebook',
        'Twitter',
        'Other',
      ]),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  IncomeInformation: Joi.when('isExistingCustomer', {
    is: false,
    then: Joi.object({
      EmploymentStatus: enumValidator('EMPLOYMENT_STATUS', [
        'Employed Full-Time',
        'Employed Part-Time',
        'Self-Employed',
        'Unemployed',
        'Retired',
        'Student',
      ]),
      EmploymentLenght: optionalString('EMPLOYMENT_LENGTH'),
      GrossMonthlyIncome: Joi.number().min(0).optional().messages({
        'number.base': errorConstants.SALES.GROSS_MONTHLY_INCOME_MUST_BE_NUMBER,
        'number.min': errorConstants.SALES.GROSS_MONTHLY_INCOME_NEGATIVE,
      }),
      preferredMethodOfIncomeVerification: enumValidator(
        'INCOME_VERIFICATION_METHOD',
        ['Pay Stub', 'Bank Statement', 'Tax Return', 'Verbal Confirmation']
      ),
      EmploymentType: optionalString('EMPLOYMENT_TYPE'),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
});

// 🔹 Final Schema
export const addSalesSchema = Joi.object({
  customerInfo: customerInfoSchema.required(),
}).required();

export const editSalesSchema = addSalesSchema.fork(
  Object.keys(addSalesSchema.describe().keys),
  (schema) => schema.optional()
);
