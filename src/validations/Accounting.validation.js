import Joi from 'joi';
import errorConstants from '../utils/errors.js';

export const addAccountingSchema = Joi.object({
  AccountingDetails: Joi.object({
    receiptNumber: Joi.string().trim().required().messages({
      'string.base': errorConstants.ACCOUNTING.RECEIPT_NUMBER_MUST_BE_STRING,
      'any.required': errorConstants.ACCOUNTING.RECEIPT_NUMBER_REQUIRED,
      'string.empty': errorConstants.ACCOUNTING.RECEIPT_NUMBER_REQUIRED,
    }),
    customerId: Joi.string().trim().optional(),
    vin: Joi.string().trim().optional(),
    stockId: Joi.string().trim().optional(),
    make: Joi.string().trim().optional(),
    salesType: Joi.string().trim().optional(),
    paymentSchedule: Joi.string().trim().optional(),
    financingCalculationMethod: Joi.string().trim().optional(),
    totalNumberOfPayments: Joi.number().integer().min(0).optional(),
    installmentNumber: Joi.number().integer().min(0).optional(),
    dueDate: Joi.date().iso().optional(),
  }).required(),

  billDetails: Joi.object({
    billType: Joi.string().trim().optional(),
    paymentDate: Joi.date().iso().allow(null).optional(),
    amount: Joi.number().min(0).default(0),
    paymentType: Joi.string().trim().optional(),
    note: Joi.string().trim().allow('', null).optional(),
  }).optional(),
});

export const getAccountingByIdSchema = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid accounting ID format',
      'any.required': 'Accounting ID is required',
    }),
});

export const getAccountingByStockIdSchema = Joi.object({
  id: Joi.string().trim().min(1).required().messages({
    'string.base': 'Stock ID must be a string',
    'string.empty': 'Stock ID is required',
    'any.required': 'Stock ID is required',
  }),
});
