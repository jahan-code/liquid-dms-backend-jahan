import mongoose from 'mongoose';

const NetTradeInSchema = new mongoose.Schema(
  {
    isBuyHerePayHere: { type: Boolean, default: false },

    tradeInDetails: {
      amountAllowed: { type: Number, default: 0, min: 0 },
      actualCashValue: { type: Number, default: 0, min: 0 },
      previousSoldVehicle: { type: Boolean, default: false },
    },

    payoffInformation: {
      payoffApplicable: { type: Boolean, default: false },
      payoffOwed: { type: Boolean },
      payoffToYou: { type: Boolean },
      accountNumber: { type: String },
      payoffAmount: { type: Number, min: 0 },
      payoffToLenderName: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
      },
      phone: { type: String },
      quotedBy: { type: String },
      goodThrough: { type: Date },
    },

    linkedSales: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales' },
    linkedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

    // Vendor Information
    vendorInfo: {
      isExistingVendor: { type: Boolean, default: false },
      vendorId: { type: String }, // For existing vendors
      category: { type: String },
      name: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      primaryContactNumber: { type: String },
      alternativeContactNumber: { type: String },
      contactPerson: { type: String },
      email: { type: String },
      accountNumber: { type: String },
      taxIdOrSSN: { type: String },
      note: { type: String },
      billofsales: { type: String },
    },

    vehicleInfo: {
      basicDetails: {
        vehicleTitle: String,
        vin: String,
        make: String,
        model: String,
        style: String,
        bodyType: String,
        manufacturingYear: Number,
        vehicleType: String,
        condition: String,
        certified: String,
      },
      specifications: {
        transmission: String,
        tranSpeed: Number,
        drivetrain: String,
        engineCylinders: Number,
        engineSize: String,
        fuelType: String,
        mpgCombined: Number,
        mpgCity: Number,
        mpgHighway: Number,
        towCapacity: Number,
        passengers: Number,
        weight: Number,
        mileage: String,
        mileageIs: String,
      },
      exteriorInterior: {
        exteriorColor: String,
        exteriorColor2: String,
        colorDescription: String,
        interiorColor: String,
        tag: String,
        decal: String,
        gpsSerial: String,
      },
      titleRegistration: {
        titleApplication: String,
        titleId: Boolean,
        stateTitleIn: String,
        title: String,
        titleDate: Date,
        country: String,
      },
      inspection: {
        inspected: Boolean,
        inspectionNumber: String,
        inspectionDate: Date,
        inspectedBy: String,
        warranty: String,
        deviceHasStarterInterrupt: Boolean,
      },
      keySecurity: {
        ignitionKeyCode: String,
        doorKeyCode: String,
        valetKeyCode: String,
      },
      features: { type: [String], default: [] },
      images: {
        featuredImageUrl: String,
        otherImageUrls: [String],
      },
    },

    addToInventory: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('NetTradeIn', NetTradeInSchema);
