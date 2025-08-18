import Sales from '../models/Sales.js';
import Customer from '../models/customer.js';
import Vehicle from '../models/vehicle.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import {
  createSalesSchema,
  addSalesDetailsSchema,
  addSalesSchema,
} from '../validations/Sales.validation.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import NetTradeIn from '../models/netTradeIn.js';
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
      // Mark vehicle as Pending when Add Sales is initiated
      try {
        await Vehicle.findByIdAndUpdate(vehicle._id, {
          $set: { salesStatus: 'Pending' },
        });
      } catch (e) {
        logger.warn({
          message: 'Could not update vehicle salesStatus to Pending',
          error: e?.message,
        });
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
      pricing: {
        isCashSale: req.body?.isCashSale ?? undefined,
        salesType: req.body?.salesType ?? undefined,
      },
      // Sales status is stored on Vehicle; keep Sales minimal
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
        isCashSale: salesObj.pricing?.isCashSale,
        salesType: salesObj.pricing?.salesType,
        salesDetails: salesObj.pricing?.salesDetails || {},
        // Buy Here Pay Here specific data
        ...(!salesObj.pricing?.isCashSale && {
          paymentSchedule: salesObj.pricing?.paymentSchedule,
          paymentDetails: salesObj.pricing?.paymentDetails,
        }),
      },

      // Dealer costs removed
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

    const { isCashSale, pricing } = value;
    const { salesDetails, paymentSchedule, paymentDetails } = pricing || {};

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
    const computeOtherTaxes = (vehiclePrice, breakdown) => {
      const base = Number(vehiclePrice || 0);
      const items = Array.isArray(breakdown) ? breakdown : [];
      let total = 0;
      const enriched = items.map((t) => {
        const rate = Number(t?.ratePercent || 0);
        const amount = Math.max(0, (base * rate) / 100);
        total += amount;
        return {
          category: t?.category || 'Custom Tax',
          ratePercent: rate,
          calculatedAmount: amount,
        };
      });
      return { totalOtherTaxes: total, enriched };
    };

    const existingDetails =
      (existingSales.pricing?.salesDetails &&
        (existingSales.pricing.salesDetails.toObject?.() ||
          existingSales.pricing.salesDetails)) ||
      {};
    // Remove any numeric netTradeIn from incoming payload
    const sanitizedIncoming = { ...(salesDetails || {}) };
    if (Object.prototype.hasOwnProperty.call(sanitizedIncoming, 'netTradeIn')) {
      delete sanitizedIncoming.netTradeIn;
    }
    const mergedInput = { ...existingDetails, ...sanitizedIncoming };

    let setPayload;
    let unsetPayload;

    if (isCashSale) {
      // Cash Sales: store everything in salesDetails (merge to preserve netTradeIn fields)
      if (salesDetails?.otherTaxesBreakdown?.length) {
        const { totalOtherTaxes, enriched } = computeOtherTaxes(
          mergedInput?.vehiclePrice,
          mergedInput?.otherTaxesBreakdown
        );
        const newSalesDetails = {
          ...mergedInput,
          otherTaxes: totalOtherTaxes,
          otherTaxesBreakdown: enriched,
        };
        setPayload = {
          'pricing.isCashSale': isCashSale,
          'pricing.salesType': 'Cash Sales',
          'pricing.salesDetails': newSalesDetails,
        };
      } else {
        setPayload = {
          'pricing.isCashSale': isCashSale,
          'pricing.salesType': 'Cash Sales',
          'pricing.salesDetails': mergedInput,
        };
      }
      // Unset the other objects
      unsetPayload = {
        'pricing.paymentSchedule': 1,
        'pricing.paymentDetails': 1,
      };
    } else {
      // Buy Here Pay Here: store in three separate objects (merge to preserve netTradeIn fields)
      if (salesDetails?.otherTaxesBreakdown?.length) {
        const { totalOtherTaxes, enriched } = computeOtherTaxes(
          mergedInput?.vehiclePrice,
          mergedInput?.otherTaxesBreakdown
        );
        const newSalesDetails = {
          ...mergedInput,
          otherTaxes: totalOtherTaxes,
          otherTaxesBreakdown: enriched,
        };
        setPayload = {
          'pricing.isCashSale': isCashSale,
          'pricing.salesType': 'Buy Here Pay Here',
          'pricing.salesDetails': newSalesDetails,
        };
      } else {
        setPayload = {
          'pricing.isCashSale': isCashSale,
          'pricing.salesType': 'Buy Here Pay Here',
          'pricing.salesDetails': mergedInput,
        };
      }
      const mergedSchedule = {
        ...(existingSales.pricing?.paymentSchedule?.toObject?.() ||
          existingSales.pricing?.paymentSchedule ||
          {}),
        ...(paymentSchedule || {}),
      };
      const mergedDetails = {
        ...(existingSales.pricing?.paymentDetails?.toObject?.() ||
          existingSales.pricing?.paymentDetails ||
          {}),
        ...(paymentDetails || {}),
      };
      setPayload['pricing.paymentSchedule'] = mergedSchedule;
      setPayload['pricing.paymentDetails'] = mergedDetails;
    }

    const updateOps = { $set: setPayload };
    if (unsetPayload) updateOps.$unset = unsetPayload;

    // Mark linked vehicle as Sold automatically when sales details are saved
    try {
      const vehicleId =
        existingSales?.vehicleInfo ||
        existingSales?.pricing?.salesDetails?.vehicleId;
      if (vehicleId) {
        await Vehicle.findByIdAndUpdate(vehicleId, {
          $set: { salesStatus: 'Sold' },
        });
      }
    } catch (e) {
      logger.warn({
        message: 'Could not update vehicle salesStatus to Sold',
        error: e?.message,
      });
    }

    const updatedSales = await Sales.findByIdAndUpdate(salesId, updateOps, {
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
        isCashSale: salesObj.pricing?.isCashSale,
        salesType: salesObj.pricing?.salesType,
        salesDetails: salesObj.pricing?.salesDetails,
        // Buy Here Pay Here specific data
        ...(!salesObj.pricing?.isCashSale && {
          paymentSchedule: salesObj.pricing?.paymentSchedule,
          paymentDetails: salesObj.pricing?.paymentDetails,
        }),
      },

      // Dealer costs removed
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
// removed addDealerCosts

// ✅ Update Sales Status Controller
// removed updateSalesStatus

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

    const sales = await Sales.findById(id).populate(['customerInfo']);

    if (!sales) {
      logger.warn({
        message: `❌ Sales not found for ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    // Shape response to match other functions
    const salesObj = sales.toObject();
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
        isCashSale: salesObj.pricing?.isCashSale,
        salesType: salesObj.pricing?.salesType,
        salesDetails: salesObj.pricing?.salesDetails || {},
        // Buy Here Pay Here specific data
        ...(!salesObj.pricing?.isCashSale && {
          paymentSchedule: salesObj.pricing?.paymentSchedule,
          paymentDetails: salesObj.pricing?.paymentDetails,
        }),
      },

      // Dealer costs removed
    };

    return SuccessHandler(
      structuredResponse,
      200,
      'Sales record fetched successfully',
      res
    );
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

    // Build update payload incrementally to avoid touching fields
    // that were not provided in the request
    const updateData = {};

    // Handle customer updates (only if customerInfo provided)
    if (customerInfo) {
      if (customerInfo.isExistingCustomer) {
        customer = await Customer.findOne({
          customerId: customerInfo.customerId,
        });
        if (!customer) {
          return next(
            new ApiError(errorConstants.SALES.CUSTOMER_NOT_FOUND, 404)
          );
        }
      } else {
        // For new customers in edit, create customer record
        const existingCustomer = await Customer.findOne({
          'CustomerInformation.email': customerInfo.CustomerInformation?.email,
        });
        if (existingCustomer) {
          return next(
            new ApiError(errorConstants.SALES.EMAIL_ALREADY_EXISTS, 409)
          );
        }

        // Generate customer ID using the same utility as customerController
        const newCustomerId = await generateCustomerId(
          customerInfo.CustomerInformation?.firstName || 'CUST'
        );

        customer = new Customer({
          customerId: newCustomerId,
          CustomerInformation: customerInfo.CustomerInformation,
          IncomeInformation: customerInfo.IncomeInformation,
        });

        await customer.save();
      }

      // Only set when we actually handled customer
      updateData.customerInfo = customer._id;
    }

    // Handle vehicle updates (only if vehicleInfo provided)
    if (vehicleInfo && vehicleInfo.vehicleId) {
      vehicle = await Vehicle.findById(vehicleInfo.vehicleId);
      if (!vehicle) {
        return next(new ApiError('Vehicle not found', 404));
      }
      updateData.vehicleInfo = vehicle._id;
    }

    // Prepare update data for simple fields (only if provided)
    if (typeof salesType !== 'undefined') updateData.salesType = salesType;
    if (typeof salesDetails !== 'undefined')
      updateData.salesDetails = salesDetails;
    if (typeof salesStatus !== 'undefined')
      updateData.salesStatus = salesStatus;

    // Add type-specific details
    if (typeof salesType !== 'undefined') {
      if (salesType === 'Cash Sales') {
        if (typeof cashSalesDetails !== 'undefined') {
          updateData.cashSalesDetails = cashSalesDetails;
        }
        // Explicitly remove BHPH details when switching types
        updateData.buyHerePayHereDetails = undefined;
      } else if (salesType === 'Buy Here Pay Here') {
        if (typeof buyHerePayHereDetails !== 'undefined') {
          updateData.buyHerePayHereDetails = buyHerePayHereDetails;
        }
        // Explicitly remove cash sales details when switching types
        updateData.cashSalesDetails = undefined;
      }
    }

    const updatedSales = await Sales.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate(['customerInfo']);

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

    const allSales = await Sales.find().populate(['customerInfo']);

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

// removed getSalesByType and getSalesStatistics

// ✅ Update Net Trade-In Info (toggle + reference)
export const updateNetTradeInInfo = async (req, res, next) => {
  try {
    logger.info('🔁 Update net trade-in info request received');

    const { id } = req.query;
    if (!id) return next(new ApiError('Sales ID is required', 400));

    const { enabled, netTradeInId } = req.body || {};
    if (enabled === undefined)
      return next(new ApiError('enabled is required', 400));

    const sales = await Sales.findById(id);
    if (!sales) return next(new ApiError('Sales record not found', 404));

    const update = {
      'pricing.salesDetails.netTradeInEnabled': Boolean(enabled),
      'pricing.salesDetails.netTradeInId': enabled
        ? netTradeInId || null
        : null,
    };

    const updated = await Sales.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate(['customerInfo']);

    // Link NetTradeIn back to this sale when enabled and id provided
    if (Boolean(enabled) && netTradeInId) {
      await NetTradeIn.findByIdAndUpdate(
        netTradeInId,
        { $set: { linkedSales: updated._id } },
        { new: true }
      );
    }

    return SuccessHandler(
      updated,
      200,
      'Net trade-in info updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update net trade-in info error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
