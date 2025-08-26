import Accounting from '../models/Accounting.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import ApiError from '../utils/ApiError.js';
import logger from '../functions/logger.js';
import errorConstants from '../utils/errors.js';
import Sales from '../models/Sales.js';
import Customer from '../models/customer.js';

export const createAccounting = async (req, res, next) => {
  try {
    logger.info('🧾 Creating accounting entry');
    const payload = req.body || {};

    // Derive receiptNumber and totalNumberOfPayments from nested AccountingDetails (preferred)
    const receiptNumber =
      payload?.AccountingDetails?.receiptNumber || payload?.receiptNumber;
    const totalNumberOfPayments =
      payload?.AccountingDetails?.totalNumberOfPayments ??
      payload?.totalNumberOfPayments;

    if (!receiptNumber) {
      return next(new ApiError('receiptNumber is required', 400));
    }

    // Count existing installments for this receipt
    const existingCount = await Accounting.countDocuments({
      'AccountingDetails.receiptNumber': receiptNumber,
    });
    const nextInstallment = existingCount + 1;

    if (
      typeof totalNumberOfPayments === 'number' &&
      nextInstallment > totalNumberOfPayments
    ) {
      return next(
        new ApiError(
          'All installments already recorded for this receiptNumber',
          400
        )
      );
    }

    // Ensure nested structure exists
    payload.AccountingDetails = payload.AccountingDetails || {};
    payload.AccountingDetails.receiptNumber = receiptNumber;
    payload.AccountingDetails.installmentNumber = nextInstallment;

    // Auto-calculate dueDate when not provided, based on payment schedule
    if (!payload.AccountingDetails.dueDate) {
      // Try to derive schedule from payload first, else from Sales
      const scheduleFromPayload = payload.AccountingDetails.paymentSchedule;
      let schedule = (scheduleFromPayload || '').trim();
      let firstPaymentDate, secondPaymentDate;

      if (!schedule) {
        const linkedSale = await Sales.findOne({ receiptId: receiptNumber });
        if (linkedSale) {
          schedule =
            linkedSale?.pricing?.paymentSchedule?.paymentSchedule || '';
          firstPaymentDate =
            linkedSale?.pricing?.paymentSchedule?.firstPaymentDate;
          secondPaymentDate =
            linkedSale?.pricing?.paymentSchedule?.secondPaymentDate;
          // Fallback for very first date
          if (!firstPaymentDate) {
            firstPaymentDate =
              linkedSale?.pricing?.paymentSchedule?.firstPaymentStarts ||
              linkedSale?.pricing?.paymentDetails?.firstPaymentDate;
          }
        }
      }

      // Find previous due date from last accounting entry for this receipt
      const lastEntry = await Accounting.findOne({
        'AccountingDetails.receiptNumber': receiptNumber,
      })
        .sort({ 'AccountingDetails.installmentNumber': -1, createdAt: -1 })
        .lean();

      const prevDue = lastEntry?.AccountingDetails?.dueDate
        ? new Date(lastEntry.AccountingDetails.dueDate)
        : firstPaymentDate
          ? new Date(firstPaymentDate)
          : undefined;

      let nextDue;
      const addDays = (d, n) => {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
      };
      const addMonths = (d, n) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() + n);
        return x;
      };

      if (prevDue) {
        const sched = (schedule || '').toLowerCase();
        if (sched === 'weekly') nextDue = addDays(prevDue, 7);
        else if (sched === 'bi-weekly' || sched === 'biweekly')
          nextDue = addDays(prevDue, 14);
        else if (sched === 'semi-monthly' || sched === 'semimonthly') {
          // Use first/second payment days when available
          if (firstPaymentDate && secondPaymentDate) {
            const firstDay = new Date(firstPaymentDate).getDate();
            const secondDay = new Date(secondPaymentDate).getDate();
            const prevDay = prevDue.getDate();
            const base = new Date(prevDue);
            if (prevDay === firstDay) {
              // move to second day of the same/next month
              nextDue = new Date(
                base.getFullYear(),
                base.getMonth(),
                secondDay
              );
              if (nextDue <= prevDue)
                nextDue = new Date(
                  base.getFullYear(),
                  base.getMonth() + 1,
                  secondDay
                );
            } else {
              // move to first day of next month
              nextDue = new Date(
                base.getFullYear(),
                base.getMonth() + 1,
                firstDay
              );
            }
          } else {
            // Fallback: every ~15 days
            nextDue = addDays(prevDue, 15);
          }
        } else {
          // Default to monthly
          nextDue = addMonths(prevDue, 1);
        }
      }

      if (nextDue) {
        payload.AccountingDetails.dueDate = nextDue;
      }

      // Ensure schedule stored if derived
      if (schedule && !payload.AccountingDetails.paymentSchedule) {
        payload.AccountingDetails.paymentSchedule = schedule;
      }
    }

    const entry = await Accounting.create(payload);
    return SuccessHandler(entry, 201, 'Accounting entry created', res);
  } catch (err) {
    logger.error('Create accounting failed', err);
    // Return generic error (no special-case for duplicate key)
    return next(new ApiError(err?.message || 'Internal Server Error', 500));
  }
};

export const getSalesByCustomerId = async (req, res, next) => {
  try {
    logger.info('🔍 Get sales by customer ID request received');

    const { customerId } = req.query;

    if (!customerId) {
      logger.warn({
        message: '❌ Customer ID is required',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Customer ID is required', 400));
    }

    // First find the customer by customerId
    const customer = await Customer.findOne({ customerId: customerId });
    if (!customer) {
      logger.warn({
        message: `❌ Customer not found for customer ID: ${customerId}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Customer not found', 404));
    }

    // Then find sales record that references this customer
    const sales = await Sales.findOne({ customerInfo: customer._id })
      .sort({ createdAt: -1 }) // Get the most recent sales record
      .populate(['customerInfo', 'vehicleInfo']);

    if (!sales) {
      logger.warn({
        message: `❌ Sales not found for customer ID: ${customerId}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.SALES.SALES_NOT_FOUND, 404));
    }

    // Shape response
    const salesObj = sales.toObject();

    // Derive installment count and latest recorded due date from Accounting
    const receipt = salesObj.receiptId;
    let installmentCount = 0;
    let latestDueDate = null;
    if (receipt) {
      installmentCount = await Accounting.countDocuments({
        'AccountingDetails.receiptNumber': receipt,
      });
      const lastEntry = await Accounting.findOne({
        'AccountingDetails.receiptNumber': receipt,
      })
        .sort({ 'AccountingDetails.installmentNumber': -1, createdAt: -1 })
        .lean();
      latestDueDate = lastEntry?.AccountingDetails?.dueDate || null;
    }

    const structuredResponse = {
      receiptId: salesObj.receiptId,
      stockId: salesObj.vehicleInfo?.stockId || null,
      vin: salesObj.vehicleInfo?.basicDetails?.vin || null,
      make: salesObj.vehicleInfo?.basicDetails?.make || null,
      salesType: salesObj.pricing?.salesType || null,
      paymentSchedule:
        salesObj.pricing?.paymentSchedule?.paymentSchedule || null,
      financingCalculationMethod:
        salesObj.pricing?.paymentSchedule?.financingCalculationMethod || null,
      totalNumberOfPayments:
        salesObj.pricing?.paymentSchedule?.numberOfPayments || null,
      nextPaymentDueDate:
        salesObj.pricing?.paymentDetails?.nextPaymentDueDate || null,
      installmentCount,
      latestDueDate,
    };

    return SuccessHandler(
      structuredResponse,
      200,
      'Sales record fetched successfully by customer ID',
      res
    );
  } catch (error) {
    logger.error('❌ Get sales by customer ID error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
