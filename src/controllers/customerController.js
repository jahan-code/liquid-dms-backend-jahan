import Customer from '../models/customer.js';
import Sales from '../models/Sales.js';
import Vehicle from '../models/vehicle.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import { addCustomerSchema } from '../validations/Customer.validation.js';
import { generateCustomerId } from '../utils/idGenerator.js';
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
      createdBy: req.user?.userId,
    });

    if (existingCustomer) {
      logger.warn({
        message: `❌ Customer already exists with email: ${value.CustomerInformation.email}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.CUSTOMER.ALREADY_EXISTS, 409));
    }
    const customId = await generateCustomerId(CustomerInformation.firstName, req.user?.userId);

    // ✅ Create new customer
    const newCustomer = new Customer({
      CustomerInformation,
      IncomeInformation,
      customerId: customId,
      createdBy: req.user?.userId,
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

    const customer = await Customer.findOne({ _id: customerId, createdBy: req.user?.userId });

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
    const customer = await Customer.findOne({ _id: customerId, createdBy: req.user?.userId });

    if (!customer) {
      return next(new ApiError('Customer not found', 404));
    }

    // 👇 Extract new email and check for duplicate
    const newEmail = value.CustomerInformation.email;

    const existingEmailCustomer = await Customer.findOne({
      'CustomerInformation.email': newEmail,
      _id: { $ne: customerId }, // ✅ Exclude current customer
      createdBy: req.user?.userId,
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
    const totalCustomers = await Customer.countDocuments({ createdBy: req.user?.userId });

    // Fetch paginated customers, most recent first
    const customers = await Customer.find({ createdBy: req.user?.userId })
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(skip)
      .limit(parsedLimit);

    if (!customers || customers.length === 0) {
      return next(new ApiError('No customers found', 404));
    }

    // Map customer IDs for bulk sales lookup
    const customerIds = customers.map((c) => c._id);
    // Get latest sales per customer (by createdAt desc)
    const sales = await Sales.find({ customerInfo: { $in: customerIds } })
      .select('customerInfo vehicleInfo createdAt')
      .sort({ createdAt: -1 });

    // Keep only the most recent sale per customer
    const latestSaleByCustomer = new Map();
    for (const s of sales) {
      const key = String(s.customerInfo);
      if (!latestSaleByCustomer.has(key)) {
        latestSaleByCustomer.set(key, s);
      }
    }

    // Fetch vehicles for those latest sales to get salesStatus
    const vehicleIds = Array.from(latestSaleByCustomer.values())
      .map((s) => s.vehicleInfo)
      .filter(Boolean);
    const vehicles = vehicleIds.length
      ? await Vehicle.find({ _id: { $in: vehicleIds } })
          .select('_id salesStatus isDeleted')
          .lean()
      : [];
    const vehicleStatusById = new Map(
      vehicles.map((v) => [String(v._id), v.salesStatus])
    );

    // Attach salesStatus summary to each customer
    const customersWithStatus = customers.map((c) => {
      const sale = latestSaleByCustomer.get(String(c._id));
      const vehicleId = sale?.vehicleInfo ? String(sale.vehicleInfo) : null;
      const salesStatus = vehicleId ? vehicleStatusById.get(vehicleId) || null : null;
      return { ...c.toObject(), salesStatus };
    });

    // Send paginated response with salesStatus
    return SuccessHandler(
      {
        total: totalCustomers,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(totalCustomers / parsedLimit),
        customers: customersWithStatus,
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
    const customers = await Customer.find({ createdBy: req.user?.userId }).sort({ createdAt: -1 });

    if (!customers || customers.length === 0) {
      return next(new ApiError('No customers found', 404));
    }

    // Map customer IDs for bulk sales lookup
    const customerIds = customers.map((c) => c._id);
    const sales = await Sales.find({ customerInfo: { $in: customerIds } })
      .select('customerInfo vehicleInfo createdAt')
      .sort({ createdAt: -1 });

    const latestSaleByCustomer = new Map();
    for (const s of sales) {
      const key = String(s.customerInfo);
      if (!latestSaleByCustomer.has(key)) {
        latestSaleByCustomer.set(key, s);
      }
    }

    const vehicleIds = Array.from(latestSaleByCustomer.values())
      .map((s) => s.vehicleInfo)
      .filter(Boolean);
    const vehicles = vehicleIds.length
      ? await Vehicle.find({ _id: { $in: vehicleIds } })
          .select('_id salesStatus isDeleted')
          .lean()
      : [];
    const vehicleStatusById = new Map(
      vehicles.map((v) => [String(v._id), v.salesStatus])
    );

    const customersWithStatus = customers.map((c) => {
      const sale = latestSaleByCustomer.get(String(c._id));
      const vehicleId = sale?.vehicleInfo ? String(sale.vehicleInfo) : null;
      const salesStatus = vehicleId ? vehicleStatusById.get(vehicleId) || null : null;
      return { ...c.toObject(), salesStatus };
    });

    return SuccessHandler(
      customersWithStatus,
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

    const deletedCustomer = await Customer.findOneAndDelete({ _id: customerId, createdBy: req.user?.userId });

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
