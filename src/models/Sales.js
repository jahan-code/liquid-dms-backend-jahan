import mongoose from 'mongoose';

const SalesSchema = new mongoose.Schema(
  {
    // Receipt ID (auto-generated)
    receiptId: {
      type: String,
      unique: true,
      required: true,
    },

    // Reference to Customer (always required, will be created if new)
    customerInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },

    // Reference to Vehicle

    // Sales Type: Cash Sales or Buy Here Pay Here
    salesType: {
      type: String,
      enum: ['Cash Sales', 'Buy Here Pay Here'],
      required: false,
    },
    // Radio flag for sales type selection
    isCashSale: {
      type: Boolean,
      default: null,
    },

    // Sales Details (restructured based on UI)
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
      dealerServiceFee: {
        type: Number,
        min: 0,
      },
      netTradeIn: {
        type: Number,
        min: 0,
      },
      deposit: {
        type: Number,
        min: 0,
      },
      paymentType: {
        type: String,
        enum: ['Cash', 'Check', 'Credit Card', 'Other'],
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
    },
    // Payment Schedule (Buy Here Pay Here only)
    paymentSchedule: {
      paymentSchedule: {
        type: String,
        enum: ['Monthly', 'Weekly', 'Bi-weekly'],
      },
      financingCalculationMethod: {
        type: String,
        enum: ['Simple Interest', 'Payment Amount'],
      },
      numberOfPayments: {
        type: Number,
        min: 1,
      },
      firstPaymentStarts: {
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

    // Dealer Costs
    dealerCosts: {
      totalDealerCosts: {
        type: Number,
        min: 0,
        default: 0,
      },
      notes: {
        type: String,
        default: '',
      },
      additionalCosts: [
        {
          description: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            min: 0,
            required: true,
          },
        },
      ],
    },

    // Sales Status
    salesStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Refunded'],
      default: 'Pending',
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
  salesType: 1,
  salesStatus: 1,
});

// Pre-save middleware to calculate total amount
SalesSchema.pre('save', function (next) {
  const sd = this.salesDetails || {};
  const cash = this.cashSalesDetails || {};
  const bhph = this.buyHerePayHereDetails || {};
  const dealer = this.dealerCosts || {};

  let total = 0;
  total += sd.vehiclePrice ?? 0;
  total += sd.governmentFees ?? 0;
  total += sd.salesTax ?? 0;
  total += sd.otherTaxes ?? 0;
  total += sd.dealerServiceFee ?? 0;
  total -= sd.netTradeIn ?? 0;
  total -= sd.deposit ?? 0;

  if (this.isCashSale === true) {
    total += cash.serviceContract ?? 0;
  } else if (this.isCashSale === false) {
    total += bhph.serviceContract ?? 0;
    total += bhph.ertFee ?? 0;
  }

  total += dealer.totalDealerCosts ?? 0;

  this.totalAmount = Math.max(0, total);
  next();
});

export default mongoose.model('Sales', SalesSchema);
