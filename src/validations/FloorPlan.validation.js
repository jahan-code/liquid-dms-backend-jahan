import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Reusable Validators
const requiredString = (field) =>
  Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': errorConstants.FLOOR_PLAN[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.FLOOR_PLAN[`${field}_REQUIRED`],
      'any.required': errorConstants.FLOOR_PLAN[`${field}_REQUIRED`],
    });

const optionalString = (field) =>
  Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': errorConstants.FLOOR_PLAN[`${field}_MUST_BE_STRING`],
    });

const enumValidator = (field, values) =>
  Joi.string()
    .valid(...values)
    .messages({
      'any.only': errorConstants.FLOOR_PLAN[`${field}_INVALID`],
    });

// 🔹 Field Validators
const companyNameValidator = requiredString('COMPANY_NAME');
const streetValidator = requiredString('STREET');
const cityValidator = requiredString('CITY');
const stateValidator = requiredString('STATE');
const zipValidator = requiredString('ZIP');
const phoneValidator = Joi.string()
  .trim()
  .required()
  .min(10)
  .max(20)
  .pattern(/^[+]?[\d\s\-().]+$/)
  .messages({
    'string.base': errorConstants.FLOOR_PLAN.PHONE_MUST_BE_STRING,
    'string.empty': errorConstants.FLOOR_PLAN.PHONE_REQUIRED,
    'any.required': errorConstants.FLOOR_PLAN.PHONE_REQUIRED,
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot exceed 20 characters',
    'string.pattern.base':
      'Phone number must be a valid format (e.g., 555-123-4567, (555) 123-4567, or +1-555-123-4567)',
  });

const contactPersonValidator = Joi.string()
  .trim()
  .required()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s\-.]+$/)
  .messages({
    'string.base': errorConstants.FLOOR_PLAN.CONTACT_PERSON_MUST_BE_STRING,
    'string.empty': errorConstants.FLOOR_PLAN.CONTACT_PERSON_REQUIRED,
    'any.required': errorConstants.FLOOR_PLAN.CONTACT_PERSON_REQUIRED,
    'string.min': 'Contact person name must be at least 2 characters long',
    'string.max': 'Contact person name cannot exceed 100 characters',
    'string.pattern.base':
      'Contact person name can only contain letters, spaces, hyphens, and periods',
  });

const statusValidator = enumValidator('STATUS', ['Active', 'Inactive']).default(
  'Active'
);

const aprValidator = Joi.number()
  .min(0)
  .max(100)
  .messages({
    'number.base': errorConstants.FLOOR_PLAN.APR_MUST_BE_NUMBER,
    'number.min': errorConstants.FLOOR_PLAN.APR_TOO_LOW,
    'number.max': errorConstants.FLOOR_PLAN.APR_TOO_HIGH,
  })
  .default(0.0);

const interestCalculationDaysValidator = Joi.number()
  .integer()
  .min(1)
  .max(365)
  .messages({
    'number.base': errorConstants.FLOOR_PLAN.INTEREST_DAYS_MUST_BE_NUMBER,
    'number.min': errorConstants.FLOOR_PLAN.INTEREST_DAYS_TOO_LOW,
    'number.max': errorConstants.FLOOR_PLAN.INTEREST_DAYS_TOO_HIGH,
    'number.integer': errorConstants.FLOOR_PLAN.INTEREST_DAYS_INTEGER,
  })
  .default(30);

const feesTypeValidator = enumValidator('FEES_TYPE', [
  'One Time',
  'Plus for each Curtailment',
]).default('Plus for each Curtailment');

const feeValidator = Joi.number()
  .min(0)
  .messages({
    'number.base': errorConstants.FLOOR_PLAN.FEE_MUST_BE_NUMBER,
    'number.min': errorConstants.FLOOR_PLAN.FEE_NEGATIVE,
  })
  .default(0.0);

const termLengthValidator = Joi.number()
  .integer()
  .min(0)
  .messages({
    'number.base': errorConstants.FLOOR_PLAN.TERM_LENGTH_MUST_BE_NUMBER,
    'number.min': errorConstants.FLOOR_PLAN.TERM_LENGTH_TOO_LOW,
    'number.integer': errorConstants.FLOOR_PLAN.TERM_LENGTH_INTEGER,
  })
  .default(0);

const percentReductionValidator = Joi.number()
  .min(0)
  .max(100)
  .messages({
    'number.base': errorConstants.FLOOR_PLAN.PERCENT_REDUCTION_MUST_BE_NUMBER,
    'number.min': errorConstants.FLOOR_PLAN.PERCENT_REDUCTION_TOO_LOW,
    'number.max': errorConstants.FLOOR_PLAN.PERCENT_REDUCTION_TOO_HIGH,
  })
  .default(0.0);

const interestAndFeesValidator = Joi.boolean().default(false);

// 🔹 Nested Schemas
const companyDetailsSchema = Joi.object({
  companyName: companyNameValidator.required(),
  street: streetValidator.required(),
  city: cityValidator.required(),
  state: stateValidator.required(),
  zip: zipValidator.required(),
  phone: phoneValidator.required(),
  contactPerson: contactPersonValidator.required(),
  status: statusValidator.required(),
  dateOpened: Joi.date().allow('').optional(),
}).required();

const rateSchema = Joi.object({
  apr: aprValidator.required(),
  interestCalculationDays: interestCalculationDaysValidator.required(),
}).required();

const feesSchema = Joi.object({
  type: feesTypeValidator,
  adminFee: feeValidator.required(),
  setUpFee: feeValidator.required(),
  additionalFee: feeValidator,
}).required();

const termSchema = Joi.object({
  lengthInDays: termLengthValidator.required(),
  daysUntilFirstCurtailment: termLengthValidator.required(),
  percentPrincipalReduction: percentReductionValidator.required(),
  daysUntillSecondCurtailment: termLengthValidator.optional(),
  percentPrincipalReduction2: percentReductionValidator.optional(),
  interestAndFeesWithEachCurtailment: interestAndFeesValidator,
}).required();

// 🔹 Final Schema
export const addFloorPlanSchema = Joi.object({
  CompanyDetails: companyDetailsSchema,
  Rate: rateSchema,
  Fees: feesSchema,
  term: termSchema,
  additionalNotes: optionalString('ADDITIONAL_NOTES'),
}).required();
