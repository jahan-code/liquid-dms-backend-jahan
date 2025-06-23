// models/Vehicle.js
import mongoose from 'mongoose';
const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  new Array(30),
  (val, index) => currentYear - index
);
const vehicleSchema = new mongoose.Schema(
  {
    basicDetails: {
      vehicleTitle: String,
      vin: String,
      make: {
        type: String,
        enum: [
          'Toyota',
          'Honda',
          'Ford',
          'Chevrolet',
          'Nissan',
          'Mercedes-Benz',
          'BMW',
          'kia',
          'Jeep',
          'Hyundai',
        ],
      },
      model: String,
      style: {
        type: String,
        enum: [
          'Coupe',
          'Sedan',
          'Hatchback',
          'SUV',
          'Van',
          'Convertible',
          'Crossover',
          'Minivan',
          'Pickup',
          'Roadster',
        ],
      },
      bodyType: {
        type: String,
        enum: ['2DR', '4DR'],
      },
      manufacturingYear: {
        type: Number,
        enum: yearOptions,
      },
      vehicleType: {
        type: String,
        enum: [
          'Car',
          'Truck',
          'Van',
          'SUV',
          'Motorcycle',
          'Bus',
          'Trailer',
          'RV',
          'Commercial',
          'Other',
        ],
        required: true,
      },
      condition: {
        type: String,
        enum: ['New', 'Used', 'Rebuild'],
      },
      certified: {
        type: String,
        enum: ['Yes', 'No'],
      },
    },

    specifications: {
      transmission: {
        type: String,
        enum: [
          'Automatic',
          'Manual',
          'CVT(Continuously Variable Transmission)',
          'Dual-Clutch',
          'Tiptronic',
          'Semi-Automatic',
        ],
      },
      tranSpeed: Number,
      drivetrain: {
        type: String,
        enum: ['AWD', 'FWD', 'RWD', '4WD'],
      },
      engineCylinders: Number,
      engineSize: String,
      fuelType: {
        type: String,
        enum: ['Gas', 'Diesel', 'Electric', 'Hybrid'],
      },
      mpgCombined: Number,
      mpgCity: Number,
      mpgHighway: Number,
      towCapacity: String,
      passengers: Number,
      weight: String,
      mileage: {
        type: Number,
        enum: [2021, 2022, 2023],
      },
      mileageIs: {
        type: String,
        enum: [
          'Actual',
          'Not Actual',
          'Exempt',
          'Unkown',
          'TMU(True Mileage Unkown)',
        ],
      },
    },
    // Exterior & Interior Info
    exteriorInterior: {
      exteriorColor: {
        type: String,
        enum: [
          'Black',
          'White',
          'Gray',
          'Silver',
          'Red',
          'Blue',
          'Green',
          'Yellow',
          'Orange',
          'Brown',
          'Gold',
          'Maroon',
          'Beige',
          'Purple',
          'Pink',
          'Other',
        ],
      },
      exteriorColor2: {
        type: String,
        enum: [
          'Black',
          'White',
          'Gray',
          'Silver',
          'Red',
          'Blue',
          'Green',
          'Yellow',
          'Orange',
          'Brown',
          'Gold',
          'Maroon',
          'Beige',
          'Purple',
          'Pink',
          'Other',
        ],
      },
      colorDescription: String,
      interiorColor: {
        type: String,
        enum: [
          'Black',
          'Gray',
          'Beige',
          'Tan',
          'White',
          'Brown',
          'Red',
          'Blue',
        ],
      },
      tag: String,
      decal: String,
      gpsSerial: String,
    },
    // Title & Registration

    titleRegistration: {
      titleApplication: String,
      titleId: Boolean,
      stateTitleIn: {
        type: String,
        enum: [
          'Alabama',
          'Alaska',
          'Arizona',
          'Arkansas',
          'California',
          'Colorado',
          'Connecticut',
          'Delaware',
          'Florida',
          'Georgia',
          'Hawaii',
          'Idaho',
          'Illinois',
          'Indiana',
          'Iowa',
        ],
      },
      title: String,
      titleDate: Date,
      country: {
        type: String,
        enum: [
          'USA(United States of America)',
          'Canada',
          'UK',
          'Australia',
          'Germany',
          'France',
          'Italy',
          'Spain',
          'Japan',
          'China',
          'India',
          'Brazil',
          'South Africa',
          'Russia',
          'South Korea',
          'Netherlands',
        ],
      },
    },
    // Inspection
    inspection: {
      inspected: Boolean,
      inspectionNumber: String,
      inspectionDate: Date,
      inspectedBy: String,
      warranty: {
        type: String,
        enum: [
          '3 months/3,000 miles',
          '6 months/6,000 miles',
          '12 months/12,000 miles',
          'Factory Warranty Remaining',
          'Extended Warranty Available',
          'Certified Pre-Owned',
        ],
      },
      deviceHasStarterInterrupt: Boolean,
    },

    // Key & Security Codes
    keySecurity: {
      ignitionKeyCode: String,
      doorKeyCode: String,
      valetKeyCode: String,
    },

    // Features
    features: {
      type: [String], // array of strings
      default: [],
    },

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
