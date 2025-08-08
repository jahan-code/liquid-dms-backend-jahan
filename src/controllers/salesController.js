import Sales from '../models/Sales.js';
import Customer from '../models/customer.js';
import Vehicle from '../models/vehicle.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import {
  createSalesSchema,
  addSalesDetailsSchema,
  addDealerCostsSchema,
  updateSalesStatusSchema,
  addSalesSchema,
} from '../validations/Sales.validation.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import generateCustomerId from '../utils/generateCustomerId.js';
import generateReceiptId from '../utils/generateReceiptId.js';

// ✅ Step 1: Create Sales Record Controller
export const createSales = async (req, res, next) => {
  try {
    logger.info('💰 Create sales record request received');

    // 🔍 Validate request body
    const { error, value } = createSalesSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const { customerInfo, vehicleInfo } = value;
    let customer;
    let vehicle;

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
        return next(new ApiError(errorConstants.CUSTOMER.ALREADY_EXISTS, 409));
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

    // 🚗 Handle Vehicle
    if (vehicleInfo && vehicleInfo.vehicleId) {
      vehicle = await Vehicle.findById(vehicleInfo.vehicleId);
      if (!vehicle) {
        logger.warn({
          message: `❌ Vehicle not found: ${vehicleInfo.vehicleId}`,
          timestamp: new Date().toISOString(),
        });
        return next(new ApiError('Vehicle not found', 404));
      }
    } else {
      vehicle = undefined;
    }

    // Generate receipt ID
    const receiptId = await generateReceiptId();

    // Create sales record
    const sales = new Sales({
      receiptId: receiptId,
      customerInfo: customer ? customer._id : undefined,
      isCashSale: req.body?.isCashSale ?? undefined,
      salesType: req.body?.salesType ?? undefined,
    });

    const salesResponse = await sales.save();

    // Populate customer details only (vehicleInfo removed from schema)
    await salesResponse.populate(['customerInfo']);

    // Shape response: omit irrelevant pricing block at creation time
    const salesObj = salesResponse.toObject();

    // Create beautifully structured response
    const structuredResponse = {
      _id: salesObj._id,
      receiptId: salesObj.receiptId,
      salesStatus: salesObj.salesStatus,
      totalAmount: salesObj.totalAmount,
      createdAt: salesObj.createdAt,
      updatedAt: salesObj.updatedAt,

      // Customer Information Section
      customerInfo: {
        _id: salesObj.customerInfo?._id,
        customerId: salesObj.customerInfo?.customerId,
        CustomerInformation: salesObj.customerInfo?.CustomerInformation,
        IncomeInformation: salesObj.customerInfo?.IncomeInformation,
        createdAt: salesObj.customerInfo?.createdAt,
        updatedAt: salesObj.customerInfo?.updatedAt,
      },

      // Pricing Section - Conditional based on sales type
      pricing: {
        isCashSale: salesObj.isCashSale,
        salesType: salesObj.salesType,
        salesDetails: salesObj.salesDetails,
        // Cash Sales specific data
        ...(salesObj.isCashSale && {
          cashSalesData: {
            serviceContract: salesObj.salesDetails?.serviceContract || 0,
          },
        }),
        // Buy Here Pay Here specific data
        ...(!salesObj.isCashSale && {
          paymentSchedule: salesObj.paymentSchedule,
          paymentDetails: salesObj.paymentDetails,
        }),
      },

      // Dealer Costs Section
      dealerCosts: {
        totalDealerCosts: salesObj.dealerCosts?.totalDealerCosts || 0,
        notes: salesObj.dealerCosts?.notes || '',
        additionalCosts: salesObj.dealerCosts?.additionalCosts || [],
      },
    };

    logger.info({
      message: `✅ Sales record created successfully with receipt ID: ${receiptId}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      structuredResponse,
      200,
      'Sales record created successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Create sales error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Step 2: Add Sales Details Controller (Updated to handle both common + type-specific)
export const addSalesDetails = async (req, res, next) => {
  try {
    logger.info('💰 Add sales details request received');

    // 1. Validate sales ID from query
    const { id: salesId } = req.query;
    if (!salesId) {
      return next(new ApiError('Sales ID is required', 400));
    }

    // 2. Validate request body
    const { error, value } = addSalesDetailsSchema.validate(req.body);
    if (error) {
      logger.warn({
        message: `❌ Joi validation error in route PUT /sales/sales-details: ${error.details[0].message}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const { isCashSale, salesDetails, paymentSchedule, paymentDetails } = value;

    // 3. Find existing sales record
    const existingSales = await Sales.findById(salesId);
    if (!existingSales) {
      logger.warn({
        message: `❌ Sales record not found: ${salesId}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Sales record not found', 404));
    }

    // 4. Update sales record based on type
    const updateData = {
      isCashSale,
      salesType: isCashSale ? 'Cash Sales' : 'Buy Here Pay Here',
    };

    if (isCashSale) {
      // Cash Sales: store everything in salesDetails
      updateData.salesDetails = salesDetails;
      // Unset the other objects
      updateData.$unset = {
        paymentSchedule: 1,
        paymentDetails: 1,
      };
    } else {
      // Buy Here Pay Here: store in three separate objects
      updateData.salesDetails = salesDetails;
      updateData.paymentSchedule = paymentSchedule;
      updateData.paymentDetails = paymentDetails;
    }

    const updatedSales = await Sales.findByIdAndUpdate(salesId, updateData, {
      new: true,
      runValidators: true,
    });

    // 5. Populate customer details
    await updatedSales.populate(['customerInfo']);

    // 6. Shape response based on type
    const salesObj = updatedSales.toObject();

    // Create beautifully structured response
    const structuredResponse = {
      _id: salesObj._id,
      receiptId: salesObj.receiptId,
      salesStatus: salesObj.salesStatus,
      totalAmount: salesObj.totalAmount,
      createdAt: salesObj.createdAt,
      updatedAt: salesObj.updatedAt,

      // Customer Information Section
      customerInfo: {
        _id: salesObj.customerInfo?._id,
        customerId: salesObj.customerInfo?.customerId,
        CustomerInformation: salesObj.customerInfo?.CustomerInformation,
        IncomeInformation: salesObj.customerInfo?.IncomeInformation,
        createdAt: salesObj.customerInfo?.createdAt,
        updatedAt: salesObj.customerInfo?.updatedAt,
      },

      // Pricing Section - Conditional based on sales type
      pricing: {
        isCashSale: salesObj.isCashSale,
        salesType: salesObj.salesType,
        salesDetails: salesObj.salesDetails,
        // Cash Sales specific data
        ...(salesObj.isCashSale && {
          cashSalesData: {
            serviceContract: salesObj.salesDetails?.serviceContract || 0,
          },
        }),
        // Buy Here Pay Here specific data
        ...(!salesObj.isCashSale && {
          paymentSchedule: salesObj.paymentSchedule,
          paymentDetails: salesObj.paymentDetails,
        }),
      },

      // Dealer Costs Section
      dealerCosts: {
        totalDealerCosts: salesObj.dealerCosts?.totalDealerCosts || 0,
        notes: salesObj.dealerCosts?.notes || '',
        additionalCosts: salesObj.dealerCosts?.additionalCosts || [],
      },
    };

    logger.info({
      message: `✅ Sales details updated successfully for sales ID: ${salesId}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { sales: structuredResponse },
      200,
      'Sales details updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add sales details error:', error);
    return next(new ApiError('Internal Server Error', 500));
  }
};

// ✅ Step 3: Add Dealer Costs Controller
export const addDealerCosts = async (req, res, next) => {
  try {
    logger.info('💰 Add dealer costs request received');

    // 1. Validate sales ID from query
    const { id: salesId } = req.query;
    if (!salesId) {
      return next(new ApiError('Sales ID is required', 400));
    }

    // 2. Validate request body
    const { error, value } = addDealerCostsSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    // 3. Find the sales record to update
    const sales = await Sales.findById(salesId);
    if (!sales) {
      return next(new ApiError('Sales record not found', 404));
    }

    // 4. Apply updates to the document
    const updateData = {};
    Object.keys(value.dealerCosts).forEach((key) => {
      updateData[`dealerCosts.${key}`] = value.dealerCosts[key];
    });

    const updatedSales = await Sales.findByIdAndUpdate(
      salesId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(['customerInfo', 'vehicleInfo']);

    return SuccessHandler(
      { sales: updatedSales },
      200,
      'Dealer costs updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add dealer costs error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Update Sales Status Controller
export const updateSalesStatus = async (req, res, next) => {
  try {
    logger.info('🔄 Update sales status request received');

    const { id } = req.query;
    const { error, value } = updateSalesStatusSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return next(new ApiError(error.details[0].message, 400));
    }

    if (!id) {
      return next(new ApiError('Sales ID is required', 400));
    }

    const updatedSales = await Sales.findByIdAndUpdate(
      id,
      { $set: { salesStatus: value.salesStatus } },
      { new: true }
    ).populate(['customerInfo', 'vehicleInfo']);

    if (!updatedSales) {
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    return SuccessHandler(
      updatedSales,
      200,
      'Sales status updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update sales status error:', error);
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

    const sales = await Sales.findById(id).populate([
      'customerInfo',
      'vehicleInfo',
    ]);

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

// ✅ Edit Sales Controller (Legacy - for backward compatibility)
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

    const {
      customerInfo,
      vehicleInfo,
      salesType,
      salesDetails,
      cashSalesDetails,
      buyHerePayHereDetails,
      salesStatus,
    } = value;
    let customer;
    let vehicle;

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

    // Handle vehicle updates
    vehicle = await Vehicle.findById(vehicleInfo.vehicleId);
    if (!vehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // Prepare update data
    const updateData = {
      customerInfo: customer._id,
      vehicleInfo: vehicle._id,
      salesType: salesType,
      salesDetails: salesDetails,
      salesStatus: salesStatus,
    };

    // Add type-specific details
    if (salesType === 'Cash Sales') {
      updateData.cashSalesDetails = cashSalesDetails;
      updateData.buyHerePayHereDetails = undefined; // Remove BHPH details
    } else if (salesType === 'Buy Here Pay Here') {
      updateData.buyHerePayHereDetails = buyHerePayHereDetails;
      updateData.cashSalesDetails = undefined; // Remove cash sales details
    }

    const updatedSales = await Sales.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate(['customerInfo', 'vehicleInfo']);

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

    const allSales = await Sales.find().populate([
      'customerInfo',
      'vehicleInfo',
    ]);

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

// ✅ Get Sales by Type Controller
export const getSalesByType = async (req, res, next) => {
  try {
    logger.info('🔍 Get sales by type request received');

    const { type } = req.query;

    if (!type || !['Cash Sales', 'Buy Here Pay Here'].includes(type)) {
      logger.warn({
        message: '❌ Valid sales type is required',
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(
          'Valid sales type is required (Cash Sales or Buy Here Pay Here)',
          400
        )
      );
    }

    const sales = await Sales.find({ salesType: type }).populate([
      'customerInfo',
      'vehicleInfo',
    ]);

    if (sales.length === 0) {
      logger.warn({
        message: `❌ No ${type} records found`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(`No ${type} records found`, 404));
    }

    return SuccessHandler(
      sales,
      200,
      `${type} records fetched successfully`,
      res
    );
  } catch (error) {
    logger.error('❌ Get sales by type error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Get Sales Statistics Controller
export const getSalesStatistics = async (req, res, next) => {
  try {
    logger.info('📊 Get sales statistics request received');

    const totalSales = await Sales.countDocuments();
    const cashSales = await Sales.countDocuments({ salesType: 'Cash Sales' });
    const buyHerePayHereSales = await Sales.countDocuments({
      salesType: 'Buy Here Pay Here',
    });

    const pendingSales = await Sales.countDocuments({ salesStatus: 'Pending' });
    const completedSales = await Sales.countDocuments({
      salesStatus: 'Completed',
    });
    const cancelledSales = await Sales.countDocuments({
      salesStatus: 'Cancelled',
    });
    const refundedSales = await Sales.countDocuments({
      salesStatus: 'Refunded',
    });

    // Calculate total revenue
    const totalRevenue = await Sales.aggregate([
      { $match: { salesStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const statistics = {
      totalSales,
      salesByType: {
        cashSales,
        buyHerePayHereSales,
      },
      salesByStatus: {
        pending: pendingSales,
        completed: completedSales,
        cancelled: cancelledSales,
        refunded: refundedSales,
      },
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
    };

    return SuccessHandler(
      statistics,
      200,
      'Sales statistics fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Get sales statistics error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
