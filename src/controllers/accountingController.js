import Accounting from '../models/Accounting.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import ApiError from '../utils/ApiError.js';
import logger from '../functions/logger.js';
import errorConstants from '../utils/errors.js';
import Sales from '../models/Sales.js';
import Customer from '../models/customer.js';
import { checkFloorPlanStatus } from '../utils/floorPlanUtils.js';
import paginate from '../utils/paginate.js';
import mongoose from 'mongoose';

export const createAccounting = async (req, res, next) => {
  try {
    logger.info('🧾 Creating accounting entry');
    const payload = req.body || {};

    const receiptNumber =
      payload?.AccountingDetails?.receiptNumber || payload?.receiptNumber;
    const totalNumberOfPayments =
      payload?.AccountingDetails?.totalNumberOfPayments ??
      payload?.totalNumberOfPayments;

    if (!receiptNumber) {
      return next(new ApiError('receiptNumber is required', 400));
    }

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

    payload.AccountingDetails = payload.AccountingDetails || {};
    payload.AccountingDetails.receiptNumber = receiptNumber;
    payload.AccountingDetails.installmentNumber = nextInstallment;

    // Always derive schedule and dates from Sales (fallbacks) and payload
    const scheduleFromPayload = payload.AccountingDetails.paymentSchedule;
    let schedule = (scheduleFromPayload || '').trim();

    const linkedSale = await Sales.findOne({
      receiptId: receiptNumber,
    }).populate('vehicleInfo');
    let firstPaymentDate =
      linkedSale?.pricing?.paymentSchedule?.firstPaymentDate || null;
    let secondPaymentDate =
      linkedSale?.pricing?.paymentSchedule?.secondPaymentDate || null;
    const salesFirstStart =
      linkedSale?.pricing?.paymentSchedule?.firstPaymentStarts || null;
    const salesFirstPaymentDetails =
      linkedSale?.pricing?.paymentDetails?.firstPaymentDate || null;
    const salesNextDue =
      linkedSale?.pricing?.paymentDetails?.nextPaymentDueDate || null;

    // Persist stockId from linked sale's vehicle if available
    if (linkedSale?.vehicleInfo?.stockId) {
      payload.AccountingDetails.stockId = linkedSale.vehicleInfo.stockId;
    }

    if (!schedule) {
      schedule = linkedSale?.pricing?.paymentSchedule?.paymentSchedule || '';
    }
    if (!firstPaymentDate)
      firstPaymentDate = salesFirstStart || salesFirstPaymentDetails;

    // If first installment, set base due date without advancing
    if (nextInstallment === 1) {
      const initialDue =
        (payload.AccountingDetails.dueDate &&
          new Date(payload.AccountingDetails.dueDate)) ||
        (firstPaymentDate && new Date(firstPaymentDate)) ||
        (salesNextDue && new Date(salesNextDue)) ||
        new Date();
      payload.AccountingDetails.dueDate = initialDue;
    } else {
      // Pull latest due from Accounting
      const lastEntry = await Accounting.findOne({
        'AccountingDetails.receiptNumber': receiptNumber,
      })
        .sort({ 'AccountingDetails.installmentNumber': -1, createdAt: -1 })
        .lean();

      // prevDue priority: last accounting due > sales.nextPaymentDueDate > firstPaymentDate
      const prevDue =
        (lastEntry?.AccountingDetails?.dueDate &&
          new Date(lastEntry.AccountingDetails.dueDate)) ||
        (salesNextDue && new Date(salesNextDue)) ||
        (firstPaymentDate && new Date(firstPaymentDate)) ||
        undefined;

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
          if (firstPaymentDate && secondPaymentDate) {
            const firstDay = new Date(firstPaymentDate).getDate();
            const secondDay = new Date(secondPaymentDate).getDate();
            const prevDay = prevDue.getDate();
            const base = new Date(prevDue);
            if (prevDay === firstDay) {
              let candidate = new Date(
                base.getFullYear(),
                base.getMonth(),
                secondDay
              );
              if (candidate <= prevDue)
                candidate = new Date(
                  base.getFullYear(),
                  base.getMonth() + 1,
                  secondDay
                );
              nextDue = candidate;
            } else {
              nextDue = new Date(
                base.getFullYear(),
                base.getMonth() + 1,
                firstDay
              );
            }
          } else {
            nextDue = addDays(prevDue, 15);
          }
        } else {
          nextDue = addMonths(prevDue, 1);
        }
      }

      if (nextDue) {
        payload.AccountingDetails.dueDate = nextDue;
      }
    }

    const entry = await Accounting.create(payload);

    // Update Sales.nextPaymentDueDate to the applied due date
    if (linkedSale && payload?.AccountingDetails?.dueDate) {
      await Sales.updateOne(
        { _id: linkedSale._id },
        {
          $set: {
            'pricing.paymentDetails.nextPaymentDueDate':
              payload.AccountingDetails.dueDate,
          },
        }
      );
    }

    // Check and update floor plan status automatically (optimized)
    await checkFloorPlanStatus(receiptNumber);

    return SuccessHandler(entry, 201, 'Accounting entry created', res);
  } catch (err) {
    logger.error('Create accounting failed', err);
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

    // Normalize totalNumberOfPayments to be at least installmentCount
    const storedNum = salesObj.pricing?.paymentSchedule?.numberOfPayments;
    const totalNumberOfPayments =
      typeof storedNum === 'number'
        ? Math.max(storedNum, installmentCount)
        : installmentCount || null;
    const remainingPayments =
      totalNumberOfPayments != null
        ? Math.max(totalNumberOfPayments - installmentCount, 0)
        : null;

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
      totalNumberOfPayments,
      nextPaymentDueDate:
        salesObj.pricing?.paymentDetails?.nextPaymentDueDate || null,
      installmentCount,
      latestDueDate,
      remainingPayments,
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

// ✅ List all accounting entries (paginated)
export const getAllAccountings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: parsedLimit } = paginate(page, limit);

    // Build aggregation to get only the most recent installment per receiptNumber
    const baseSort = {
      'AccountingDetails.receiptNumber': 1,
      'AccountingDetails.installmentNumber': -1,
      createdAt: -1,
    };

    const pipeline = [
      { $sort: baseSort },
      {
        $group: {
          _id: '$AccountingDetails.receiptNumber',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
      // Compute installment count per receiptNumber
      {
        $lookup: {
          from: 'accountings',
          let: { receipt: '$AccountingDetails.receiptNumber' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$AccountingDetails.receiptNumber', '$$receipt'],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'installmentCounts',
        },
      },
      {
        $addFields: {
          installmentCount: {
            $ifNull: [{ $arrayElemAt: ['$installmentCounts.count', 0] }, 0],
          },
        },
      },
      // Derive status: cleared if all installments completed, else pending
      {
        $addFields: {
          status: {
            $cond: [
              {
                $and: [
                  {
                    $gte: [
                      {
                        $ifNull: [
                          '$AccountingDetails.totalNumberOfPayments',
                          -1,
                        ],
                      },
                      0,
                    ],
                  },
                  {
                    $gte: [
                      '$installmentCount',
                      {
                        $ifNull: [
                          '$AccountingDetails.totalNumberOfPayments',
                          999999,
                        ],
                      },
                    ],
                  },
                ],
              },
              'cleared',
              'pending',
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parsedLimit },
    ];

    const countPipeline = [
      {
        $group: { _id: '$AccountingDetails.receiptNumber' },
      },
      { $count: 'count' },
    ];

    const [accountings, countResult] = await Promise.all([
      Accounting.aggregate(pipeline),
      Accounting.aggregate(countPipeline),
    ]);

    const total = countResult?.[0]?.count || 0;

    const response = {
      totalAccountings: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / parsedLimit) || 0,
      accountings,
    };

    return SuccessHandler(
      response,
      200,
      'Latest installment per receipt fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Get all accountings error:', error);
    next(new ApiError(error.message || 'Internal Server Error', 500));
  }
};

// ✅ Get single accounting by Mongo _id
export const getAccountingById = async (req, res, next) => {
  try {
    const id = req.query.id;
    if (!id) return next(new ApiError('Accounting ID is required', 400));
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError('Invalid accounting ID format', 400));
    }

    const doc = await Accounting.findById(id);
    if (!doc) {
      return next(new ApiError('Accounting not found', 404));
    }

    return SuccessHandler(doc, 200, 'Accounting fetched successfully', res);
  } catch (error) {
    logger.error('❌ Get accounting by ID error:', error);
    next(new ApiError(error.message || 'Internal Server Error', 500));
  }
};
