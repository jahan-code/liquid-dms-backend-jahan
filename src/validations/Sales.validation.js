import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Reusable Validators
const requiredString = (field) =>
  Joi.string()
    .trim()
    .required()
    .messages({
      'string.base':
        errorConstants.SALES?.[`${field}_MUST_BE_STRING`] ||
        `${field.replace(/_/g, ' ')} must be a string`,
      'string.empty':
        errorConstants.SALES?.[`${field}_REQUIRED`] ||
        `${field.replace(/_/g, ' ')} is required`,
      'any.required':
        errorConstants.SALES?.[`${field}_REQUIRED`] ||
        `${field.replace(/_/g, ' ')} is required`,
    });

const optionalString = (field) =>
  Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base':
        errorConstants.SALES?.[`${field}_MUST_BE_STRING`] ||
        `${field.replace(/_/g, ' ')} must be a string`,
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
      'number.base':
        errorConstants.SALES?.[`${field}_MUST_BE_NUMBER`] ||
        `${field.replace(/_/g, ' ')} must be a number`,
      'number.min':
        errorConstants.SALES?.[`${field}_NEGATIVE`] ||
        `${field.replace(/_/g, ' ')} cannot be negative`,
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
  otherTaxesBreakdown: Joi.array()
    .items(
      Joi.object({
        category: optionalString('TAX_CATEGORY'),
        ratePercent: Joi.number().min(0).messages({
          'number.base': 'Tax % must be a number',
          'number.min': 'Tax % cannot be negative',
        }),
        calculatedAmount: optionalNumber('CALCULATED_TAX'),
      })
    )
    .default([]),
  dealerServiceFee: optionalNumber('DEALER_SERVICE_FEE'),
  netTradeIn: optionalNumber('NET_TRADE_IN'),
  deposit: optionalNumber('DEPOSIT'),
  paymentType: enumValidator('PAYMENT_TYPE', ['Manual', 'Card', 'Cash']),
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
  paymentSchedule: Joi.string().trim().required().default('Monthly'),
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

// 🔹 Step 1: Create Sales Record Schema
export const createSalesSchema = Joi.object({
  customerInfo: customerInfoSchema.optional(),
  vehicleInfo: vehicleInfoSchema.optional(),
  salesType: Joi.string().optional(),
}).optional();

// 🔹 Step 2: Sales Details Schema (Updated to match UI structure)
export const addSalesDetailsSchema = Joi.object({
  pricing: Joi.object({
    isCashSale: Joi.boolean().required(),
    salesType: Joi.string().optional(),
    salesDetails: Joi.object({
      saleDate: Joi.date().required(),
      vehiclePrice: Joi.number().min(0).required(),
      governmentFees: Joi.number().min(0).required(),
      salesTax: Joi.number().min(0).required(),
      otherTaxes: Joi.number().min(0).optional(),
      otherTaxesBreakdown: Joi.array()
        .items(
          Joi.object({
            category: Joi.string().allow('', null),
            ratePercent: Joi.number().min(0).messages({
              'number.base': 'Tax % must be a number',
              'number.min': 'Tax % cannot be negative',
            }),
            calculatedAmount: Joi.number().min(0).messages({
              'number.base': 'Calculated tax must be a number',
              'number.min': 'Calculated tax cannot be negative',
            }),
          })
        )
        .default([]),
      dealerServiceFee: Joi.number().min(0).required(),
      netTradeIn: Joi.forbidden(),
      deposit: Joi.number().min(0).required(),
      // Allow for both cash and BHPH
      ertFee: Joi.number().min(0).optional(),
      paymentType: Joi.string().valid('Manual', 'Card', 'Cash').optional(),
      dateDepositReceived: Joi.date().optional(),
      enterYourInitials: Joi.string().optional(),
      pickUpNote: Joi.string().optional(),
      serviceContract: Joi.number().min(0).optional(),
    }).required(),
    paymentSchedule: Joi.when('isCashSale', {
      is: false,
      then: Joi.object({
        paymentSchedule: Joi.string().trim().required(),
        financingCalculationMethod: Joi.string()
          .valid('Simple Interest', 'Payment Amount')
          .required(),
        numberOfPayments: Joi.number().min(1).required(),
        firstPaymentStarts: Joi.date().required(),
        firstPaymentDate: Joi.when('paymentSchedule', {
          is: 'Semi-Monthly',
          then: Joi.date().required(),
          otherwise: Joi.forbidden(),
        }),
        secondPaymentDate: Joi.when('paymentSchedule', {
          is: 'Semi-Monthly',
          then: Joi.date().required(),
          otherwise: Joi.forbidden(),
        }),
      }).required(),
      otherwise: Joi.forbidden(),
    }),
    paymentDetails: Joi.when('isCashSale', {
      is: false,
      then: Joi.object({
        totalLoanAmount: Joi.number().min(0).required(),
        downPayment1: Joi.number().min(0).required(),
        amountToFinance: Joi.number().min(0).required(),
        firstPaymentDate: Joi.date().required(),
        nextPaymentDueDate: Joi.date().required(),
        note: Joi.string().optional(),
        apr: Joi.number().min(0).required(),
        // BHPH-only field
      }).required(),
      otherwise: Joi.forbidden(),
    }),
  }).required(),
  salesType: Joi.string().optional(),
}).required();

// Dealer costs removed

// 🔹 Update Sales Status Schema
export const updateSalesStatusSchema = Joi.object({
  salesStatus: enumValidator('SALES_STATUS', [
    'Pending',
    'Completed',
    'Cancelled',
    'Refunded',
  ]).required(),
}).required();

// 🔹 Net Trade-In Toggle Schema
export const updateNetTradeInInfoSchema = Joi.object({
  enabled: Joi.boolean().required(),
  netTradeInId: Joi.string().optional(),
}).required();

// 🔹 Legacy Schema (for backward compatibility)
export const addSalesSchema = Joi.object({
  customerInfo: customerInfoSchema.optional(),
  vehicleInfo: vehicleInfoSchema.optional(),
  salesType: Joi.string().optional(),
  salesDetails: salesDetailsSchema.optional(),
  cashSalesDetails: cashSalesDetailsSchema.optional(),
  buyHerePayHereDetails: buyHerePayHereDetailsSchema.optional(),
  salesStatus: Joi.string().optional(),
}).optional();

export const editSalesSchema = addSalesSchema.fork(
  Object.keys(addSalesSchema.describe().keys),
  (schema) => schema.optional()
);
