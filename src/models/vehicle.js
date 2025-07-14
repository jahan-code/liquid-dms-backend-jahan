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
        enum: [
          '1,000',
          '10,000',
          '25,000',
          '50,000',
          '75,000',
          '100,000',
          '125,000',
          '150,000+',
        ],
      },
      mileageIs: {
        type: String,
        enum: [
          'Actual',
          'Not Actual',
          'Exempt',
          'Unknown',
          'TMU (True Mileage Unknown)',
        ],
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

    images: {
      featuredImageUrl: String,
      otherImageUrls: [String],
    },
    costDetails: {
      purchaseDate: Date,
      originalCost: Number,
      buyersFee: Number,
      transportationFee: Number,
      lotFee: Number,
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
      company: String,

      dateOpened: Date,
      setUpFee: Number,
      adminFee: Number,
      additionalFee: Number,
      aprRate: Number,
      notes: String,
    },
    Curtailments: {
      lengthFloorPlan: Number,
      daysUntil1stCurtailment: Number,
      lengthFloorPlan2: Number,
      daysUntil2ndCurtailment: Number,
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
        enum: [
          'Individual',
          'Company-Owned',
          'Leased',
          'Financed',
          'Fleet',
          'Rental',
          'Government-Owned',
        ],
      },
      ContactNumber: String,
      Email: String,
      Address: String,
      StateofRegistration: {
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
          'Kansas',
          'Kentucky',
          'Louisiana',
          'Maine',
          'Maryland',
          'Massachusetts',
          'Michigan',
          'Minnesota',
          'Mississippi',
          'Missouri',
          'Montana',
          'Nebraska',
          'Nevada',
          'New Hampshire',
          'New Jersey',
          'New Mexico',
          'New York',
          'North Carolina',
          'North Dakota',
          'Ohio',
          'Oklahoma',
          'Oregon',
          'Pennsylvania',
          'Rhode Island',
          'South Carolina',
          'South Dakota',
          'Tennessee',
          'Texas',
          'Washington',
          'California',
          'Utah',
        ],
      },
      OwnershipStartDate: Date,
      OwnershipEndDate: Date,
      PrincipleUseofVehicle: String,
      Notes: String,
    },
    transferDocument: String,
    values: {
      MarketValue: Number,
      MSRP: Number,
    },
    // Add transferDocument here if needed, e.g.:
    OtherNotes: {
      NoteCategory: {
        type: String,
        enum: [
          'Buyer Inquiry',
          'Follow-up',
          'New Lead',
          'Call Scheduled',
          'Showroom Visit',
        ],
      },

      NoteTitle: String,

      NoteDetails: String,
    },
    uploadedNotes: String,
    markAsCompleted: { type: Boolean, default: false },
    billofsales: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);
