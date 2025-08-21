import Customer from '../models/customer.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import { addCustomerSchema } from '../validations/Customer.validation.js';
import generateCustomerId from '../utils/generateCustomerId.js';
import paginate from '../utils/paginate.js';

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

    const { CustomerInformation, IncomeInformation } = value;
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
    const customId = await generateCustomerId(CustomerInformation.firstName);

    // ✅ Create new customer
    const newCustomer = new Customer({
      CustomerInformation,
      IncomeInformation,
      customerId: customId,
    });

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

export const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.query.id;

    if (!customerId) {
      throw new ApiError(400, 'Customer ID is required');
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    return SuccessHandler(customer, 200, 'Customer fetched successfully', res);
  } catch (err) {
    next(err); // pass to global error handler
  }
};

export const editCustomerById = async (req, res, next) => {
  try {
    const customerId = req.query.id;

    if (!customerId) {
      return next(new ApiError('Customer ID is required', 400));
    }

    // ✅ Validate input
    const { error, value } = addCustomerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return next(new ApiError(error.details[0].message, 400));
    }

    // 🔍 Find the customer first
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return next(new ApiError('Customer not found', 404));
    }

    // 👇 Extract new email and check for duplicate
    const newEmail = value.CustomerInformation.email;

    const existingEmailCustomer = await Customer.findOne({
      'CustomerInformation.email': newEmail,
      _id: { $ne: customerId }, // ✅ Exclude current customer
    });

    if (existingEmailCustomer) {
      return next(new ApiError('Email already exists. ', 409));
    }

    const oldFirstName = customer.CustomerInformation.firstName;
    const newFirstName = value.CustomerInformation.firstName;

    // 🔄 If first name changed, generate new customerId
    if (oldFirstName !== newFirstName) {
      const newCustomerId = await generateCustomerId(newFirstName);
      customer.customerId = newCustomerId;
    }

    // ✏️ Update the CustomerInformation
    customer.CustomerInformation = value.CustomerInformation;
    customer.IncomeInformation = value.IncomeInformation;

    const updatedCustomer = await customer.save();

    return SuccessHandler(
      updatedCustomer,
      200,
      'Customer updated successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Edit customer error:', err);
    next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Use your reusable paginate utility
    const { skip, limit: parsedLimit } = paginate(page, limit);

    // Get total count of customers
    const totalCustomers = await Customer.countDocuments();

    // Fetch paginated customers, most recent first
    const customers = await Customer.find()
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(skip)
      .limit(parsedLimit);

    if (!customers || customers.length === 0) {
      return next(new ApiError('No customers found', 404));
    }

    // Send paginated response
    return SuccessHandler(
      {
        total: totalCustomers,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(totalCustomers / parsedLimit),
        customers,
      },
      200,
      'Customers fetched successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Get all customers error:', err);
    next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const getAllCustomersWithoutPagination = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    if (!customers || customers.length === 0) {
      return next(new ApiError('No customers found', 404));
    }

    return SuccessHandler(
      customers,
      200,
      'Customers fetched successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Get all customers (no pagination) error:', err);
    next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const deleteCustomerById = async (req, res, next) => {
  try {
    const customerId = req.query.id;

    if (!customerId) {
      return next(new ApiError('Customer ID is required', 400));
    }

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return next(new ApiError('Customer not found', 404));
    }

    // ✅ Return only customerId
    return SuccessHandler(
      { customerId: deletedCustomer.customerId },
      200,
      'Customer deleted successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Delete customer error:', err);
    next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
