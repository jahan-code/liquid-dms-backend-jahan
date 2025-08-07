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
    vehicleInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },

    // Sales Type: Cash Sales or Buy Here Pay Here
    salesType: {
      type: String,
      enum: ['Cash Sales', 'Buy Here Pay Here'],
      required: true,
    },

    // Sales Details (common for both types)
    salesDetails: {
      saleDate: {
        type: Date,
        default: Date.now,
      },
      vehiclePrice: {
        type: Number,
        min: 0,
        default: 0,
      },
      governmentFees: {
        type: Number,
        min: 0,
        default: 0,
      },
      salesTax: {
        type: Number,
        min: 0,
        default: 0,
      },
      otherTaxes: {
        type: Number,
        min: 0,
        default: 0,
      },
      dealerServiceFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      netTradeIn: {
        type: Number,
        min: 0,
        default: 0,
      },
      deposit: {
        type: Number,
        min: 0,
        default: 0,
      },
      paymentType: {
        type: String,
        enum: [
          'Cash',
          'Check',
          'Credit Card',
          'Debit Card',
          'Bank Transfer',
          'Other',
        ],
        default: 'Cash',
      },
      dateDepositReceived: {
        type: Date,
        default: Date.now,
      },
      enterYourInitials: {
        type: String,
        trim: true,
        default: '',
      },
      pickUpNote: {
        type: String,
        trim: true,
        default: '',
      },
    },

    // Cash Sales specific fields
    cashSalesDetails: {
      serviceContract: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Buy Here Pay Here specific fields
    buyHerePayHereDetails: {
      apr: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      serviceContract: {
        type: Number,
        min: 0,
        default: 0,
      },
      ertFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      paymentSchedule: {
        type: String,
        enum: ['Weekly', 'Bi-Weekly', 'Monthly'],
        default: 'Monthly',
      },
      financingCalculationMethod: {
        type: String,
        enum: ['Simple Interest', 'Add-On Interest', 'Rule of 78s'],
        default: 'Simple Interest',
      },
      numberOfPayments: {
        type: Number,
        min: 1,
        default: 12,
      },
      firstPaymentStarts: {
        type: Date,
        default: Date.now,
      },
      totalLoanAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      downPayment1: {
        type: Number,
        min: 0,
        default: 0,
      },
      firstPaymentDate: {
        type: Date,
        default: Date.now,
      },
      nextPaymentDueDate: {
        type: Date,
        default: Date.now,
      },
      amountToFinance: {
        type: Number,
        min: 0,
        default: 0,
      },
      note: {
        type: String,
        trim: true,
        default: '',
      },
    },

    // Dealer Costs
    dealerCosts: {
      additionalCosts: [
        {
          costName: {
            type: String,
            trim: true,
            default: '',
          },
          costAmount: {
            type: Number,
            min: 0,
            default: 0,
          },
          costDescription: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
      totalDealerCosts: {
        type: Number,
        min: 0,
        default: 0,
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      },
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
  let total =
    this.salesDetails.vehiclePrice +
    this.salesDetails.governmentFees +
    this.salesDetails.salesTax +
    this.salesDetails.otherTaxes +
    this.salesDetails.dealerServiceFee;

  if (this.salesType === 'Cash Sales') {
    total += this.cashSalesDetails.serviceContract;
  } else if (this.salesType === 'Buy Here Pay Here') {
    total +=
      this.buyHerePayHereDetails.serviceContract +
      this.buyHerePayHereDetails.ertFee;
  }

  // Add dealer costs
  total += this.dealerCosts.totalDealerCosts;

  total -= this.salesDetails.netTradeIn;
  total -= this.salesDetails.deposit;

  this.totalAmount = Math.max(0, total);
  next();
});

export default mongoose.model('Sales', SalesSchema);
