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

    // Sales-specific information can be added here in the future
    // For example: salesAmount, salesDate, salesStatus, etc.
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
SalesSchema.index({ customerInfo: 1 });
SalesSchema.index({ receiptId: 1 });

export default mongoose.model('Sales', SalesSchema);
