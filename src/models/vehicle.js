// models/Vehicle.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
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
      towCapacity: String,
      passengers: Number,
      weight: String,
      mileage: Number,
      mileageIs: String,
    },
    // Exterior & Interior Info
    exteriorInterior: {
      exteriorColor: String,
      exteriorColor2: String,
      colorDescription: String,
      interiorColor: String,
      tag: String,
      decal: String,
      gpsSerial: String,
    },
    // Title & Registration

    titleRegistration: {
      titleApplication: String,
      titleIn: Boolean,
      stateTitleIn: String,
      title: String,
      titleDate: Date,
      county: String,
    },
    // Inspection
    inspection: {
      inspected: Boolean,
      inspectionNumber: String,
      inspectionDate: Date,
      inspectedBy: String,
      warranty: String,
      deviceHasStarterInterrupt: Boolean,
    },

    // Key & Security Codes
    keySecurity: {
      ignitionKeyCode: String,
      doorKeyCode: String,
      valetKeyCode: String,
    },

    // Features
    features: [String],

    // Purchase Info
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor',
      required: true,
    },

    images: {
      featuredImageUrl: String,
      otherImageUrls: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
