import mongoose from 'mongoose';

const { Schema } = mongoose;

const vendorSchema = new Schema(
  {
    category: {
      type: String,
      enum: [
        'Auction - AU',
        'Company - COM',
        'Wholesale - WS',
        'Dealer - DL',
        'Consignment - CT',
        'Private Seller - PS',
        'Manufacturer - MR',
        'Rental Company - RC',
        'Repossession - RE',
        'Trade-In - TI',
      ],
      required: true,
    },
    name: { type: String, required: true },
    street: String,
    zip: String,
    city: String,
    state: {
      type: String,
      enum: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California'],
    },
    primaryContactNumber: String,
    contactPerson: String,
    alternativeContactNumber: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    accountNumber: String,
    taxIdOrSSN: String,
    billofsales: {
      type: String,
      default: '',
    },
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vendorId: {
      type: String,
    },
  },
  { timestamps: true }
);

const vendor = mongoose.model('vendor', vendorSchema);
export default vendor;
