import mongoose from 'mongoose';

const AccountingSchema = new mongoose.Schema(
  {
    // Human-readable receipt/reference number, e.g., RC-2025-0049
    AccountingDetails: {
      receiptNumber: {
        type: String,
        required: true,
        trim: true,
      },

      // Optional links/identifiers provided by frontend
      customerId: {
        type: String,
        required: false,
        trim: true,
      },

      vin: {
        type: String,
        required: false,
        trim: true,
      },
      stockId: {
        type: String,
        required: false,
        trim: true,
      },
      make: {
        type: String,
        required: false,
        trim: true,
      },

      // Sales/plan context
      salesType: {
        type: String, // e.g., 'BHPH', 'Cash'
        required: false,
        trim: true,
      },
      paymentSchedule: {
        type: String, // e.g., 'Monthly'
        required: false,
        trim: true,
      },
      financingCalculationMethod: {
        type: String,
        required: false,
        trim: true,
      },
      loanTerm: {
        type: Number,
        min: 0,
        required: false,
      },
      totalNumberOfPayments: {
        type: Number,
        min: 0,
        required: false,
      },
      installmentNumber: {
        type: Number, // e.g., 3 for Installment #03
        min: 0,
        required: false,
      },
      dueDate: {
        type: Date,
        required: false,
      },
    },
    // Bill details for this accounting entry
    billDetails: {
      billType: { type: String, trim: true },
      paymentDate: { type: Date },
      amount: { type: Number, min: 0, default: 0 },
      paymentType: { type: String, trim: true },
      note: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Accounting', AccountingSchema);
