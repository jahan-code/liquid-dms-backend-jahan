import Customer from '../models/customer.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import { addCustomerSchema } from '../validations/Customer.validation.js';

export const addCustomer = async (req, res, next) => {
  try {
    logger.info('👤 Add customer request received');

    // ✅ Validate input (optional, if you have a Joi schema)
    const { error, value } = addCustomerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const { CustomerInformation } = value;

    // 🔎 Check if customer already exists by email
    const existingCustomer = await Customer.findOne({
      'CustomerInformation.email': value.CustomerInformation.email,
    });

    if (existingCustomer) {
      logger.warn({
        message: `❌ Customer already exists with email: ${value.CustomerInformation.email}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.CUSTOMER.ALREADY_EXISTS, 409));
    }

    // ✅ Create new customer
    const newCustomer = new Customer({ CustomerInformation });

    const customerResponse = await newCustomer.save();

    return SuccessHandler(
      customerResponse,
      200,
      'Customer added successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add customer error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
