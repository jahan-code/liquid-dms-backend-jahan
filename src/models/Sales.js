import mongoose from 'mongoose';

const SalesSchema = new mongoose.Schema(
  {
    // Receipt ID (auto-generated)
    receiptId: {
      type: String,
      unique: true,
      required: true,
    },

    // Flags and meta
    isExistingCustomer: {
      type: Boolean,
      default: null,
    },

    vehicleInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: false,
    },
    // Reference to Customer (always required, will be created if new)
    customerInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },

    // Reference to Vehicle

    // Pricing (grouped isCashSale, salesType, schedule, details)
    pricing: {
      isCashSale: { type: Boolean, default: null },
      // Reservation flag to mark a sale as reserved before completion
      isReserved: { type: Boolean, default: false },
      salesType: {
        type: String,
        enum: ['Cash Sales', 'Buy Here Pay Here'],
        required: false,
      },
      // Sales Details (common for both types)
      salesDetails: {
        // Common fields for both types
        receiptId: {
          type: String,
        },
        saleDate: {
          type: Date,
        },
        vehiclePrice: {
          type: Number,
          min: 0,
        },
        governmentFees: {
          type: Number,
          min: 0,
        },
        salesTax: {
          type: Number,
          min: 0,
        },
        otherTaxes: {
          type: Number,
          min: 0,
        },
        otherTaxesBreakdown: [
          {
            category: { type: String },
            ratePercent: { type: Number, min: 0 },
            calculatedAmount: { type: Number, min: 0 },
          },
        ],
        dealerServiceFee: {
          type: Number,
          min: 0,
        },
        // netTradeIn numeric amount removed per requirement. Use netTradeInId link only.
        netTradeInEnabled: {
          type: Boolean,
          default: false,
        },
        netTradeInId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'NetTradeIn',
          default: null,
        },
        deposit: {
          type: Number,
          min: 0,
        },
        paymentType: {
          type: String,
          enum: ['Manual', 'Card', 'Cash'],
        },
        dateDepositReceived: {
          type: Date,
        },
        enterYourInitials: {
          type: String,
        },
        pickUpNote: {
          type: String,
        },
        // Cash sales specific fields
        serviceContract: {
          type: Number,
          min: 0,
        },
        // Optional client-provided total for UI; server may override
        total: {
          type: Number,
          min: 0,
        },
      },
      // Payment Schedule (Buy Here Pay Here only)
      paymentSchedule: {
        paymentSchedule: {
          type: String,
        },
        financingCalculationMethod: {
          type: String,
        },
        numberOfPayments: {
          type: Number,
          min: 1,
        },
        firstPaymentStarts: {
          type: Date,
        },
        // Semi-Monthly only
        firstPaymentDate: {
          type: Date,
        },
        secondPaymentDate: {
          type: Date,
        },
      },
      // Payment Details (Buy Here Pay Here only)
      paymentDetails: {
        totalLoanAmount: {
          type: Number,
          min: 0,
        },
        downPayment1: {
          type: Number,
          min: 0,
        },
        amountToFinance: {
          type: Number,
          min: 0,
        },
        firstPaymentDate: {
          type: Date,
        },
        nextPaymentDueDate: {
          type: Date,
        },
        note: {
          type: String,
        },
        // Buy Here Pay Here specific fields
        apr: {
          type: Number,
          min: 0,
        },
        ertFee: {
          type: Number,
          min: 0,
        },
      },
    },

    // Total Amount (calculated)
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
SalesSchema.index({
  customerInfo: 1,
  vehicleInfo: 1,
  'pricing.salesType': 1,
});

// Pre-save middleware to calculate total amount
SalesSchema.pre('save', function (next) {
  const sd = this.pricing?.salesDetails || {};
  const pricing = this.pricing || {};

  // If client provided a salesDetails.total, prefer that as the totalAmount
  if (typeof sd.total === 'number' && !Number.isNaN(sd.total)) {
    this.totalAmount = Math.max(0, Number(sd.total));
    return next();
  }

  let total = 0;
  total += sd.vehiclePrice ?? 0;
  total += sd.governmentFees ?? 0;
  total += sd.salesTax ?? 0;
  total += sd.otherTaxes ?? 0;
  total += sd.dealerServiceFee ?? 0;
  // netTradeIn numeric value removed; do not subtract
  total -= sd.deposit ?? 0;

  if (pricing.isCashSale === true) {
    total += sd.serviceContract ?? 0;
  } else if (pricing.isCashSale === false) {
    total += pricing.paymentDetails?.ertFee ?? 0;
  }

  // dealerCosts are informational; do not add removed totalDealerCosts
  this.totalAmount = Math.max(0, total);
  next();
});

export default mongoose.model('Sales', SalesSchema);
