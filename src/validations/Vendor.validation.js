import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Individual field schemas for new Vendor
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
  .pattern(/^\d{5}$/)
  .required()
  .messages({
    'string.base': errorConstants.VENDOR.ZIP_MUST_BE_STRING,

    'any.required': errorConstants.VENDOR.ZIP_REQUIRED,
    'string.pattern.base': errorConstants.VENDOR.ZIP_INVALID_FORMAT,
  });

const citySchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.CITY_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.CITY_REQUIRED,
  'any.required': errorConstants.VENDOR.CITY_REQUIRED,
});

const stateSchema = Joi.string()
  .valid(
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  )
  .required()
  .messages({
    'string.base': errorConstants.VENDOR.STATE_MUST_BE_STRING,
    'any.only': errorConstants.VENDOR.STATE_INVALID,
    'any.required': errorConstants.VENDOR.STATE_REQUIRED,
  });

const phoneSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.PHONE_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.PRIMARY_CONTACT_NUMBER_REQUIRED,
  'any.required': errorConstants.VENDOR.PRIMARY_CONTACT_NUMBER_REQUIRED,
});

const otherPhoneSchema = Joi.string().allow('', null).messages({
  'string.base': errorConstants.VENDOR.OTHER_PHONE_MUST_BE_STRING,
});

const contactPersonSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.CONTACT_PERSON_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.CONTACT_PERSON_REQUIRED,
  'any.required': errorConstants.VENDOR.CONTACT_PERSON_REQUIRED,
});

const emailSchema = Joi.string().email().required().messages({
  'string.base': errorConstants.VENDOR.EMAIL_MUST_BE_STRING,
  'string.email': errorConstants.VENDOR.EMAIL_INVALID,
  'any.required': errorConstants.VENDOR.EMAIL_REQUIRED,
});

const accountNumberSchema = Joi.string().allow('', null).messages({
  'string.base': errorConstants.VENDOR.ACCOUNT_NUMBER_MUST_BE_STRING,
});

const taxIdSchema = Joi.string().required().messages({
  'string.base': errorConstants.VENDOR.TAX_ID_MUST_BE_STRING,
  'string.empty': errorConstants.VENDOR.TAX_ID_REQUIRED,
  'any.required': errorConstants.VENDOR.TAX_ID_REQUIRED,
});

const noteSchema = Joi.string().allow('', null).messages({
  'string.base': errorConstants.VENDOR.NOTE_MUST_BE_STRING,
});

const billOfSalesSchema = Joi.string().allow('', null).messages({
  'string.base': errorConstants.VENDOR.BILL_OF_SALES_MUST_BE_STRING,
});

// 🔹 “New Vendor” schema
export const newVendorSchema = Joi.object({
  isExistingVendor: Joi.valid(false).optional(),
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

// 🔹 “Existing Vendor” schema: only requires the flag and vendorId
export const existingVendorSchema = Joi.object({
  isExistingVendor: Joi.valid(true).required(),
  vendorId: Joi.string().required().messages({
    'string.base': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    'string.empty': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    'any.required': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
  }),
});

// 🔹 Add Vendor standalone (if you ever need a pure “create vendor” endpoint)
export const addVendorSchema = newVendorSchema;

// 🔹 Get Vendor by ID (e.g. `GET /vendors/:id`)
export const getVendorByIdSchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    'string.base': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    'string.length': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    'string.hex': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    'any.required': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
  }),
});
