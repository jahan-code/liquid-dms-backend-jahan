// models/Vehicle.js
import mongoose from 'mongoose';
const currentYear = new Date().getFullYear();
const yearOptions = Array.from(
  new Array(30),
  (val, index) => currentYear - index
);
const vehicleSchema = new mongoose.Schema(
  {
    stockId: {
      type: String,
    },

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
          'Hyundai',
          'Kia',
          'Jeep',
          'BMW',
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
          'Pickup Truck',
          'Wagon',
          'Minivan',
          'Roadster',
        ],
      },
      bodyType: {
        type: String,
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
      },
    },

    specifications: {
      transmission: {
        type: String,
        enum: [
          'Automatic',
          'Manual',
          'CVT (Continuously Variable Transmission)',
          'Dual-Clutch',
          'Tiptronic',
          'Semi-Automatic',
        ],
      },
      tranSpeed: Number,
      drivetrain: {
        type: String,
        enum: [
          'FWD (Front-Wheel Drive)',
          'RWD (Rear-Wheel Drive)',
          'AWD (All-Wheel Drive)',
          '4WD (Four-Wheel Drive)',
        ],
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
      towCapacity: Number,
      passengers: Number,
      weight: Number,
      mileage: {
        type: String,
      },
      mileageIs: {
        type: String,
      },
    },
    // Exterior & Interior Info
    exteriorInterior: {
      exteriorColor: {
        type: String,
        enum: [
          'White',
          'Black',
          'Silver',
          'Red',
          'Blue',
          'Green',
          'Yellow',
          'Gray',
          'Brown',
          'Orange',
          'Gold',
          'Maroon',
          'Beige',
        ],
      },
      exteriorColor2: {
        type: String,
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
      },
      title: String,
      titleDate: Date,
      country: {
        type: String,
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
      },
      deviceHasStarterInterrupt: Boolean,
    },

    // Key & Security Codes
    keySecurity: {
      ignitionKeyCode: String,
      doorKeyCode: String,
      valetKeyCode: String,
    },

    features: {
      type: [String],
      default: [],
    },

    // Purchase Info
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor',
      required: true,
    },
    vendorInfo: {
      isExistingVendor: { type: Boolean },
      // You can add more fields here if needed in the future
    },

    images: {
      featuredImageUrl: String,
      otherImageUrls: [String],
    },
    costDetails: {
      purchaseDate: Date,
      originalCost: { type: Number, default: 0 },
      buyersFee: { type: Number, default: 0 },
      transportationFee: { type: Number, default: 0 },
      lotFee: { type: Number, default: 0 },
      addedCosts: [
        {
          title: String,
          cost: Number,
          date: Date,
          description: String,
        },
      ],
      addedCostsTotal: Number,
    },

    floorPlanDetails: {
      isFloorPlanned: { type: Boolean, default: false },
      isExistingFloor: { type: Boolean },
      floorPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FloorPlan',
      },
      // dateOpened and notes removed as they are now inside FloorPlan model
    },
    Price: {
      Retail: Number,
      Interest: Number,
      Wholesale: Number,
      Other: Number,
    },
    Values: {
      MarketValue: Number,
      MSRP: Number,
    },
    Payement: {
      Down: Number,
      Weekly: Number,
      Monthly: Number,
    },
    Dates: {
      Arrival: Date,
      ReadytoSell: Date,
    },
    WindowSheetOptions: {
      price: { type: Boolean, default: false },
      DownPayment: { type: Boolean, default: false },
      Features: { type: Boolean, default: false },
      SalesComments: { type: Boolean, default: false },
    },
    SalesComments: String,
    PreviousOwnerDetail: {
      OwnerName: String,
      OwnershipType: {
        type: String,
      },
      ContactNumber: String,
      Email: String,
      Address: String,
      StateofRegistration: {
        type: String,
      },
      OwnershipStartDate: Date,
      OwnershipEndDate: Date,
      PrincipleUseofVehicle: String,
      Notes: String,
      transferDocuments: [String],
    },
    values: {
      MarketValue: Number,
      MSRP: Number,
    },
    // Add transferDocument here if needed, e.g.:
    OtherNotes: {
      NoteCategory: {
        type: String,
      },

      NoteTitle: String,

      NoteDetails: String,
    },
    uploadedNotes: [String],
    markAsCompleted: { type: Boolean, default: false },
    billofsales: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
