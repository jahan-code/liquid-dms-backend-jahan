import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// Individual field schemas
const categorySchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.CATEGORY_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.CATEGORY_REQUIRED,
  'any.required': errorConstants.VENDOR.CATEGORY_REQUIRED,
});

const nameSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.NAME_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.NAME_REQUIRED,
  'any.required': errorConstants.VENDOR.NAME_REQUIRED,
});

const streetSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.STREET_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.ADDRESS_REQUIRED,
  'any.required': errorConstants.VENDOR.ADDRESS_REQUIRED,
});

const zipSchema = Joi.string()
  .required()
  .pattern(/^\d{5}$/)
  .messages({
    'string.base': errorConstants.VENDOR.ZIP_MUST_BE_STRING,
    'string.pattern.base': errorConstants.VENDOR.ZIP_INVALID_FORMAT,
  });

const citySchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.CITY_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.ADDRESS_REQUIRED,
  'any.required': errorConstants.VENDOR.ADDRESS_REQUIRED,
});

const stateSchema = Joi.string()
  .valid('Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California')
  .required()
  .messages({
    'string.base': errorConstants.VENDOR.STATE_MUST_BE_STRING,
    'any.only': errorConstants.VENDOR.STATE_INVALID,
    'any.required': errorConstants.VENDOR.STATE_REQUIRED,
  });

const phoneSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.PHONE_MUST_BE_STRING,
});

const otherPhoneSchema = Joi.string().optional().allow('', null).messages({
  'string.base': errorConstants.VENDOR.OTHER_PHONE_MUST_BE_STRING,
});

const contactPersonSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.CONTACT_PERSON_MUST_BE_STRING,
});

const emailSchema = Joi.string().email().required().messages({
  'string.base': errorConstants.VENDOR.EMAIL_MUST_BE_STRING,
  'string.email': errorConstants.VENDOR.EMAIL_INVALID,
  'any.required': errorConstants.VENDOR.EMAIL_REQUIRED,
});

const accountNumberSchema = Joi.string().optional().allow('', null).messages({
  'string.base': errorConstants.VENDOR.ACCOUNT_NUMBER_MUST_BE_STRING,
});

const taxIdSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.TAX_ID_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.TAX_ID_REQUIRED,
  'any.required': errorConstants.VENDOR.TAX_ID_REQUIRED,
});

const noteSchema = Joi.string().optional().allow('', null).messages({
  'string.base': errorConstants.VENDOR.NOTE_MUST_BE_STRING,
});
const billOfSalesSchema = Joi.string().optional().allow('', null).messages({
  'string.base': errorConstants.VENDOR.BILL_OF_SALES_MUST_BE_STRING,
});

// Main vendor schema
const addVendorSchema = Joi.object({
  category: categorySchema,
  name: nameSchema,
  street: streetSchema,
  zip: zipSchema,
  city: citySchema,
  state: stateSchema,
  primaryContactNumber: phoneSchema,
  alternativeContactNumber: otherPhoneSchema,
  contactPerson: contactPersonSchema,
  email: emailSchema,
  accountNumber: accountNumberSchema,

  taxIdOrSSN: taxIdSchema,
  note: noteSchema,
  billofsales: billOfSalesSchema,
});
const getVendorByIdSchema = Joi.object({
  id: Joi.string().length(24).hex().required(),
});
export { addVendorSchema, getVendorByIdSchema };
