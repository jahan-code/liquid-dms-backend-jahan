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
    .required()
    .messages({
      'any.only': errorConstants.SALES[`${field}_INVALID`],
      'string.base': errorConstants.SALES[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.SALES[`${field}_REQUIRED`],
      'any.required': errorConstants.SALES[`${field}_REQUIRED`],
    });

const optionalNumber = (field) =>
  Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': errorConstants.SALES[`${field}_MUST_BE_NUMBER`],
      'number.min': errorConstants.SALES[`${field}_NEGATIVE`],
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

// 🔹 Vehicle Information Validator
const vehicleInfoSchema = Joi.object({
  vehicleId: Joi.string().required().messages({
    'string.base': errorConstants.SALES.VEHICLE_ID_MUST_BE_STRING,
    'string.empty': errorConstants.SALES.VEHICLE_ID_REQUIRED,
    'any.required': errorConstants.SALES.VEHICLE_ID_REQUIRED,
  }),
});

// 🔹 Sales Details Schema (common for both types)
const salesDetailsSchema = Joi.object({
  saleDate: Joi.date().default(Date.now),
  vehiclePrice: optionalNumber('VEHICLE_PRICE'),
  governmentFees: optionalNumber('GOVERNMENT_FEES'),
  salesTax: optionalNumber('SALES_TAX'),
  otherTaxes: optionalNumber('OTHER_TAXES'),
  dealerServiceFee: optionalNumber('DEALER_SERVICE_FEE'),
  netTradeIn: optionalNumber('NET_TRADE_IN'),
  deposit: optionalNumber('DEPOSIT'),
  paymentType: enumValidator('PAYMENT_TYPE', [
    'Cash',
    'Check',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Other',
  ]),
  dateDepositReceived: Joi.date().default(Date.now),
  enterYourInitials: optionalString('INITIALS'),
  pickUpNote: optionalString('PICKUP_NOTE'),
});

// 🔹 Cash Sales Details Schema
const cashSalesDetailsSchema = Joi.object({
  serviceContract: optionalNumber('SERVICE_CONTRACT'),
});

// 🔹 Buy Here Pay Here Details Schema
const buyHerePayHereDetailsSchema = Joi.object({
  apr: Joi.number().min(0).max(100).default(0).messages({
    'number.base': errorConstants.SALES.APR_MUST_BE_NUMBER,
    'number.min': errorConstants.SALES.APR_TOO_LOW,
    'number.max': errorConstants.SALES.APR_TOO_HIGH,
  }),
  serviceContract: optionalNumber('SERVICE_CONTRACT'),
  ertFee: optionalNumber('ERT_FEE'),
  paymentSchedule: enumValidator('PAYMENT_SCHEDULE', [
    'Weekly',
    'Bi-Weekly',
    'Monthly',
  ]).default('Monthly'),
  financingCalculationMethod: enumValidator('FINANCING_CALCULATION_METHOD', [
    'Simple Interest',
    'Add-On Interest',
    'Rule of 78s',
  ]).default('Simple Interest'),
  numberOfPayments: Joi.number().integer().min(1).default(12).messages({
    'number.base': errorConstants.SALES.NUMBER_OF_PAYMENTS_MUST_BE_NUMBER,
    'number.integer': errorConstants.SALES.NUMBER_OF_PAYMENTS_INTEGER,
    'number.min': errorConstants.SALES.NUMBER_OF_PAYMENTS_TOO_LOW,
  }),
  firstPaymentStarts: Joi.date().default(Date.now),
  totalLoanAmount: optionalNumber('TOTAL_LOAN_AMOUNT'),
  downPayment1: optionalNumber('DOWN_PAYMENT'),
  firstPaymentDate: Joi.date().default(Date.now),
  nextPaymentDueDate: Joi.date().default(Date.now),
  amountToFinance: optionalNumber('AMOUNT_TO_FINANCE'),
  note: optionalString('NOTE'),
});

// 🔹 Dealer Costs Schema
const dealerCostsSchema = Joi.object({
  additionalCosts: Joi.array()
    .items(
      Joi.object({
        costName: optionalString('COST_NAME'),
        costAmount: optionalNumber('COST_AMOUNT'),
        costDescription: optionalString('COST_DESCRIPTION'),
      })
    )
    .default([]),
  totalDealerCosts: optionalNumber('TOTAL_DEALER_COSTS'),
  notes: optionalString('DEALER_COSTS_NOTES'),
});

// 🔹 Step 1: Create Sales Record Schema
export const createSalesSchema = Joi.object({
  customerInfo: customerInfoSchema.required(),
  vehicleInfo: vehicleInfoSchema.required(),
  salesType: enumValidator('SALES_TYPE', [
    'Cash Sales',
    'Buy Here Pay Here',
  ]).required(),
}).required();

// 🔹 Step 2: Sales Details Schema (Updated to handle both common + type-specific)
export const addSalesDetailsSchema = Joi.object({
  salesDetails: salesDetailsSchema.required(),
  cashSalesDetails: Joi.when('salesType', {
    is: 'Cash Sales',
    then: cashSalesDetailsSchema.optional(),
    otherwise: Joi.forbidden(),
  }),
  buyHerePayHereDetails: Joi.when('salesType', {
    is: 'Buy Here Pay Here',
    then: buyHerePayHereDetailsSchema.optional(),
    otherwise: Joi.forbidden(),
  }),
  salesType: enumValidator('SALES_TYPE', [
    'Cash Sales',
    'Buy Here Pay Here',
  ]).required(),
}).required();

// 🔹 Step 3: Dealer Costs Schema
export const addDealerCostsSchema = Joi.object({
  dealerCosts: dealerCostsSchema.required(),
}).required();

// 🔹 Update Sales Status Schema
export const updateSalesStatusSchema = Joi.object({
  salesStatus: enumValidator('SALES_STATUS', [
    'Pending',
    'Completed',
    'Cancelled',
    'Refunded',
  ]).required(),
}).required();

// 🔹 Legacy Schema (for backward compatibility)
export const addSalesSchema = Joi.object({
  customerInfo: customerInfoSchema.required(),
  vehicleInfo: vehicleInfoSchema.required(),
  salesType: enumValidator('SALES_TYPE', [
    'Cash Sales',
    'Buy Here Pay Here',
  ]).required(),
  salesDetails: salesDetailsSchema.required(),
  cashSalesDetails: Joi.when('salesType', {
    is: 'Cash Sales',
    then: cashSalesDetailsSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  buyHerePayHereDetails: Joi.when('salesType', {
    is: 'Buy Here Pay Here',
    then: buyHerePayHereDetailsSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  salesStatus: enumValidator('SALES_STATUS', [
    'Pending',
    'Completed',
    'Cancelled',
    'Refunded',
  ]).default('Pending'),
}).required();

export const editSalesSchema = addSalesSchema.fork(
  Object.keys(addSalesSchema.describe().keys),
  (schema) => schema.optional()
);
