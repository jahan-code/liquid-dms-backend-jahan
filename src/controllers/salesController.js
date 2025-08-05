import Sales from '../models/Sales.js';
import Customer from '../models/customer.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import { addSalesSchema } from '../validations/Sales.validation.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import generateCustomerId from '../utils/generateCustomerId.js';
import generateReceiptId from '../utils/generateReceiptId.js';

// ✅ Add Sales Controller
export const addSales = async (req, res, next) => {
  try {
    logger.info('💰 Add sales request received');

    // 🔍 Validate request body
    const { error, value } = addSalesSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const { customerInfo } = value;
    let customer;

    // 📦 Handle Existing Customer
    if (customerInfo.isExistingCustomer) {
      customer = await Customer.findOne({
        customerId: customerInfo.customerId,
      });
      if (!customer) {
        logger.warn({
          message: `❌ Customer not found: ${customerInfo.customerId}`,
          timestamp: new Date().toISOString(),
        });
        return next(new ApiError(errorConstants.SALES.CUSTOMER_NOT_FOUND, 404));
      }
    } else {
      // 🆕 Handle New Customer
      const existingCustomer = await Customer.findOne({
        'CustomerInformation.email': customerInfo.CustomerInformation.email,
      });
      if (existingCustomer) {
        logger.warn({
          message: `❌ Customer with email already exists: ${customerInfo.CustomerInformation.email}`,
          timestamp: new Date().toISOString(),
        });
        return next(
          new ApiError(errorConstants.SALES.EMAIL_ALREADY_EXISTS, 409)
        );
      }

      // Generate customer ID using the same utility as customerController
      const newCustomerId = await generateCustomerId(
        customerInfo.CustomerInformation.firstName
      );

      // Create new customer
      customer = new Customer({
        customerId: newCustomerId,
        CustomerInformation: customerInfo.CustomerInformation,
        IncomeInformation: customerInfo.IncomeInformation,
      });

      await customer.save();
      logger.info({
        message: `✅ New customer created: ${newCustomerId}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate receipt ID
    const receiptId = await generateReceiptId();

    // Create sales record with receipt ID
    const sales = new Sales({
      receiptId: receiptId,
      customerInfo: customer._id,
    });

    const salesResponse = await sales.save();

    // Populate customer details
    await salesResponse.populate('customerInfo');

    logger.info({
      message: `✅ Sales record created successfully with receipt ID: ${receiptId}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      salesResponse,
      200,
      'Sales record created successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add sales error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Get Sales by ID Controller
export const getSalesById = async (req, res, next) => {
  try {
    logger.info('🔍 Get sales by ID request received');

    const { id } = req.query;

    if (!id) {
      logger.warn({
        message: '❌ Sales ID is required',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Sales ID is required', 400));
    }

    const sales = await Sales.findById(id).populate('customerInfo');

    if (!sales) {
      logger.warn({
        message: `❌ Sales not found for ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    return SuccessHandler(sales, 200, 'Sales record fetched successfully', res);
  } catch (error) {
    logger.error('❌ Get sales by ID error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Edit Sales Controller
export const editSales = async (req, res, next) => {
  try {
    logger.info('✏️ Edit sales request received');

    const { id } = req.query;

    const { error, value } = addSalesSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const { customerInfo } = value;
    let customer;

    // Handle customer updates
    if (customerInfo.isExistingCustomer) {
      customer = await Customer.findOne({
        customerId: customerInfo.customerId,
      });
      if (!customer) {
        return next(new ApiError(errorConstants.SALES.CUSTOMER_NOT_FOUND, 404));
      }
    } else {
      // For new customers in edit, create customer record
      const existingCustomer = await Customer.findOne({
        'CustomerInformation.email': customerInfo.CustomerInformation.email,
      });
      if (existingCustomer) {
        return next(
          new ApiError(errorConstants.SALES.EMAIL_ALREADY_EXISTS, 409)
        );
      }

      // Generate customer ID using the same utility as customerController
      const newCustomerId = await generateCustomerId(
        customerInfo.CustomerInformation.firstName
      );

      customer = new Customer({
        customerId: newCustomerId,
        CustomerInformation: customerInfo.CustomerInformation,
        IncomeInformation: customerInfo.IncomeInformation,
      });

      await customer.save();
    }

    const updatedSales = await Sales.findByIdAndUpdate(
      id,
      {
        $set: {
          customerInfo: customer._id,
        },
      },
      { new: true }
    ).populate('customerInfo');

    if (!updatedSales) {
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    return SuccessHandler(
      updatedSales,
      200,
      'Sales record updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Edit sales error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Show All Sales Controller
export const showAllSales = async (req, res, next) => {
  try {
    logger.info('📄 Show all sales request received');

    const allSales = await Sales.find().populate('customerInfo');

    if (allSales.length === 0) {
      logger.warn({
        message: '❌ No sales records found',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    return SuccessHandler(
      allSales,
      200,
      'All sales records fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Show all sales error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Delete Sales Controller
export const deleteSales = async (req, res, next) => {
  try {
    logger.info('🗑️ Delete sales request received');

    const { id } = req.query;

    if (!id) {
      logger.warn({
        message: '❌ Sales ID is required for deletion',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Sales ID is required', 400));
    }

    const existingSales = await Sales.findById(id);
    if (!existingSales) {
      logger.warn({
        message: `❌ Sales not found for deletion with ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    const deletedSales = await Sales.findByIdAndDelete(id);

    logger.info({
      message: `✅ Sales deleted successfully with ID: ${id}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { deletedSales },
      200,
      'Sales record deleted successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Delete sales error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
