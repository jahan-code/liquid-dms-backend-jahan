import Joi from 'joi';
import errorConstants from '../utils/errors.js';

// 🔹 Reusable Validators
const requiredString = (field) =>
  Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': errorConstants.VEHICLE[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.VEHICLE[`${field}_REQUIRED`],
      'any.required': errorConstants.VEHICLE[`${field}_REQUIRED`],
    });

const optionalString = (field) =>
  Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': errorConstants.VEHICLE[`${field}_MUST_BE_STRING`],
    });

const enumValidator = (field, values) =>
  Joi.string()
    .valid(...values)
    .messages({
      'any.only': errorConstants.VEHICLE[`${field}_INVALID`],
    });

// 🔹 Field Validators
const makeValidator = requiredString('MAKE').valid(
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'Mercedes-Benz',
  'BMW',
  'Kia',
  'Jeep',
  'Hyundai'
);
const modelValidator = requiredString('MODEL');
const styleValidator = enumValidator('STYLE', [
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
]);
const bodyTypeValidator = enumValidator('BODY_TYPE', ['2DR', '4DR']);
const yearValidator = Joi.number()
  .integer()
  .min(1900)
  .max(new Date().getFullYear() + 1)
  .messages({
    'number.base': errorConstants.VEHICLE.YEAR_MUST_BE_NUMBER,
    'number.min': errorConstants.VEHICLE.YEAR_TOO_OLD,
    'number.max': errorConstants.VEHICLE.YEAR_TOO_NEW,
    'number.integer': errorConstants.VEHICLE.YEAR_INTEGER,
  });
const vehicleTypeValidator = requiredString('TYPE').valid(
  'Car',
  'Truck',
  'Van',
  'SUV',
  'Motorcycle',
  'Bus',
  'Trailer',
  'RV',
  'Commercial',
  'Other'
);
const conditionValidator = enumValidator('CONDITION', [
  'New',
  'Used',
  'Rebuild',
]);
const certifiedValidator = enumValidator('CERTIFIED', ['Yes', 'No']);
const transmissionValidator = enumValidator('TRANSMISSION', [
  'Automatic',
  'Manual',
  'CVT (Continuously Variable Transmission)',
  'Dual-Clutch',
  'Tiptronic',
  'Semi-Automatic',
]);
const tranSpeedValidator = Joi.number().integer().min(1).max(10).messages({
  'number.base': errorConstants.VEHICLE.TRAN_SPEED_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.TRAN_SPEED_TOO_LOW,
  'number.max': errorConstants.VEHICLE.TRAN_SPEED_TOO_HIGH,
  'number.integer': errorConstants.VEHICLE.TRAN_SPEED_INTEGER,
});
const drivetrainValidator = enumValidator('DRIVETRAIN', [
  'FWD (Front-Wheel Drive)',
  'RWD (Rear-Wheel Drive)',
  'AWD (All-Wheel Drive)',
  '4WD (Four-Wheel Drive)',
]);
const engineCylindersValidator = Joi.number()
  .integer()
  .min(1)
  .max(16)
  .messages({
    'number.base': errorConstants.VEHICLE.CYLINDERS_MUST_BE_NUMBER,
    'number.min': errorConstants.VEHICLE.CYLINDERS_TOO_LOW,
    'number.max': errorConstants.VEHICLE.CYLINDERS_TOO_HIGH,
    'number.integer': errorConstants.VEHICLE.CYLINDERS_INTEGER,
  });
const engineSizeValidator = Joi.number().positive().messages({
  'number.base': errorConstants.VEHICLE.ENGINE_SIZE_INVALID,
  'number.positive': errorConstants.VEHICLE.ENGINE_SIZE_INVALID,
});
const fuelTypeValidator = enumValidator('FUEL_TYPE', [
  'Gas',
  'Diesel',
  'Electric',
  'Hybrid',
]);
const mpgValidator = Joi.number().min(0).messages({
  'number.base': errorConstants.VEHICLE.MPG_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.MPG_NEGATIVE,
});
const towCapacityValidator = Joi.number().min(0).messages({
  'number.base': errorConstants.VEHICLE.TOW_CAPACITY_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.TOW_CAPACITY_NEGATIVE,
});
const passengersValidator = Joi.number().integer().min(1).max(100).messages({
  'number.base': errorConstants.VEHICLE.PASSENGERS_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.PASSENGERS_TOO_LOW,
  'number.max': errorConstants.VEHICLE.PASSENGERS_TOO_HIGH,
  'number.integer': errorConstants.VEHICLE.PASSENGERS_INTEGER,
});
const mileageValidator = enumValidator('MILEAGE', [
  '1,000',
  '10,000',
  '25,000',
  '50,000',
  '75,000',
  '100,000',
  '125,000',
  '150,000+',
]);

const mileageIsValidator = enumValidator('MILEAGE_STATUS', [
  'Actual',
  'Not Actual',
  'Exempt',
  'Unknown',
  'TMU (True Mileage Unknown)',
]);
const colorValidator = enumValidator('COLOR', [
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
]);
const interiorColorValidator = enumValidator('INTERIOR_COLOR', [
  'Black',
  'Gray',
  'Beige',
  'Tan',
  'White',
  'Brown',
  'Red',
  'Blue',
]);
// const stateValidator = enumValidator('STATE', [
//   'Alabama',
//   'Alaska',
//   'Arizona',
//   'Arkansas',
//   'California',
//   'Colorado',
//   'Connecticut',
//   'Delaware',
//   'Florida',
//   'Georgia',
//   'Hawaii',
//   'Idaho',
//   'Illinois',
//   'Indiana',
//   'Iowa',
// ]);
// const countryValidator = enumValidator('COUNTRY', [
//   'USA(United States of America)',
//   'Canada',
//   'UK',
//   'Australia',
//   'Germany',
//   'France',
//   'Italy',
//   'Spain',
//   'Japan',
//   'China',
//   'India',
//   'Brazil',
//   'South Africa',
//   'Russia',
//   'South Korea',
//   'Netherlands',
// ]);
// const warrantyValidator = enumValidator('WARRANTY', [
//   '3 months/3,000 miles',
//   '6 months/6,000 miles',
//   '12 months/12,000 miles',
//   'Factory Warranty Remaining',
//   'Extended Warranty Available',
//   'Certified Pre-Owned',
// ]);

// 🔹 Smart Vendor Schema with `.when()`
const vendorInfoSchema = Joi.object({
  isExistingVendor: Joi.boolean().required(),
  vendorId: Joi.when('isExistingVendor', {
    is: true,
    then: Joi.string().required().messages({
      'string.base': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
      'string.empty': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
      'any.required': errorConstants.VENDOR.VENDOR_ID_REQUIRED,
    }),
    otherwise: Joi.forbidden(),
  }),
  category: requiredString('CATEGORY'),
  name: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('NAME'),
    otherwise: Joi.forbidden(),
  }),
  street: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('STREET'),
    otherwise: Joi.forbidden(),
  }),
  zip: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('ZIP'),
    otherwise: Joi.forbidden(),
  }),
  city: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('CITY'),
    otherwise: Joi.forbidden(),
  }),
  state: Joi.when('isExistingVendor', {
    is: false,
    then: optionalString('STATE_TITLE_IN'),
    otherwise: Joi.forbidden(),
  }),
  primaryContactNumber: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('PRIMARY_CONTACT_NUMBER'),
    otherwise: Joi.forbidden(),
  }),
  contactPerson: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('CONTACT_PERSON'),
    otherwise: Joi.forbidden(),
  }),
  alternativeContactNumber: Joi.when('isExistingVendor', {
    is: false,
    then: optionalString('ALTERNATIVE_CONTACT_NUMBER'),
    otherwise: Joi.forbidden(),
  }),
  email: Joi.when('isExistingVendor', {
    is: false,
    then: Joi.string().email().required().messages({
      'string.email': errorConstants.VENDOR.EMAIL_INVALID,
      'any.required': errorConstants.VENDOR.EMAIL_REQUIRED,
    }),
    otherwise: Joi.forbidden(),
  }),
  accountNumber: Joi.when('isExistingVendor', {
    is: false,
    then: optionalString('ACCOUNT_NUMBER'),
    otherwise: Joi.forbidden(),
  }),
  taxIdOrSSN: Joi.when('isExistingVendor', {
    is: false,
    then: requiredString('TAX_ID_OR_SSN'),
    otherwise: Joi.forbidden(),
  }),
  notes: Joi.when('isExistingVendor', {
    is: false,
    then: optionalString('NOTES'),
    otherwise: Joi.forbidden(),
  }),
  billofsales: Joi.when('isExistingVendor', {
    is: false,
    then: optionalString('BILL_OF_SALES'),
    otherwise: Joi.forbidden(),
  }),
});

// 🔹 Final Schema
export const addVehicleSchema = Joi.object({
  basicDetails: Joi.object({
    vehicleTitle: optionalString('VEHICLE_TITLE'),
    vin: requiredString('VIN'),
    make: makeValidator,
    model: modelValidator,
    style: styleValidator,
    bodyType: bodyTypeValidator,
    manufacturingYear: yearValidator,
    vehicleType: vehicleTypeValidator,
    condition: conditionValidator,
    certified: certifiedValidator,
  }),

  specifications: Joi.object({
    transmission: transmissionValidator,
    tranSpeed: tranSpeedValidator,
    drivetrain: drivetrainValidator,
    engineCylinders: engineCylindersValidator,
    engineSize: engineSizeValidator,
    fuelType: fuelTypeValidator,
    mpgCombined: mpgValidator,
    mpgCity: mpgValidator,
    mpgHighway: mpgValidator,
    towCapacity: towCapacityValidator,
    passengers: passengersValidator,
    weight: towCapacityValidator,
    mileage: mileageValidator,
    mileageIs: mileageIsValidator,
  }),

  exteriorInterior: Joi.object({
    exteriorColor: colorValidator,
    exteriorColor2: colorValidator,
    colorDescription: optionalString('COLOR_DESCRIPTION'),
    interiorColor: interiorColorValidator,
    tag: optionalString('TAG'),
    decal: optionalString('DECAL'),
    gpsSerial: optionalString('GPS_SERIAL'),
  }),

  titleRegistration: Joi.object({
    titleApplication: requiredString('TITLE_APPLICATION'),
    titleIn: Joi.boolean().required(),
    stateTitleIn: optionalString('STATE_TITLE_IN'),
    title: optionalString('TITLE'),
    titleDate: optionalString('TITLE_DATE'),
    country: optionalString('COUNTRY'),
  }),

  inspection: Joi.object({
    inspected: Joi.boolean().required(),
    inspectionNumber: optionalString('INSPECTION_NUMBER'),
    inspectionDate: optionalString('INSPECTION_DATE'),
    inspectedBy: optionalString('INSPECTED_BY'),
    warranty: optionalString('WARRANTY'),
    deviceHasStarterInterrupt: Joi.boolean().optional(),
  }),

  keySecurity: Joi.object({
    ignitionKeyCode: optionalString('IGNITION_KEY_CODE'),
    doorKeyCode: optionalString('DOOR_KEY_CODE'),
    valetKeyCode: optionalString('VALET_KEY_CODE'),
  }),

  features: Joi.array().items(Joi.string()).optional(),

  vendorInfo: vendorInfoSchema,

  images: Joi.object({
    featuredImageUrl: requiredString('FEATURED_IMAGE_URL'),
    otherImageUrls: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
});
export const AddVehicleCostSchema = Joi.object({
  costDetails: Joi.object({
    purchaseDate: Joi.date().required(),
    originalCost: Joi.number().min(0).required(),
    buyersFee: Joi.number().min(0).optional(),
    transportationFee: Joi.number().min(0).required(),
    lotFee: Joi.number().min(0).required(),
    addedCosts: Joi.array()
      .items(
        Joi.object({
          title: Joi.string().optional(),
          cost: Joi.number().min(0).optional(),
          date: Joi.date().optional(),
          description: Joi.string().allow('', null).optional(),
        })
      )
      .optional(),
  }).optional(),
  floorPlanDetails: Joi.object({
    isFloorPlanned: Joi.boolean().optional(),
    company: Joi.string().allow('', null).optional(),
    dateOpened: Joi.date().allow('').optional(),
    setUpFee: Joi.number().min(0).optional(),
    adminFee: Joi.number().min(0).optional(),
    additionalFee: Joi.number().min(0).optional(),
    aprRate: Joi.number().min(0).optional(),
    notes: Joi.string().allow('', null).optional(),
  }).optional(),
  Curtailments: Joi.object({
    lengthFloorPlan: Joi.number().min(0).optional(),
    daysUntil1stCurtailment: Joi.number().min(0).integer().optional(),
    lengthFloorPlan2: Joi.number().min(0).optional(),
    daysUntil2ndCurtailment: Joi.number().min(0).integer().optional(),
  }).optional(),
})
  .or('costDetails', 'floorPlanDetails', 'Curtailments')
  .messages({
    'object.missing':
      'At least one of costDetails, floorPlanDetails, or Curtailments is required.',
  });

export const vehicleIdQuerySchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    'string.base': errorConstants.VEHICLE.ID_MUST_BE_STRING,
    'string.length': errorConstants.VEHICLE.ID_INVALID_LENGTH,
    'string.hex': errorConstants.VEHICLE.ID_INVALID_FORMAT,
    'string.empty': errorConstants.VEHICLE.ID_REQUIRED,
    'any.required': errorConstants.VEHICLE.ID_REQUIRED,
  }),
});
export const AddVehicleSalesSchema = Joi.object({
  Price: Joi.object({
    Retail: Joi.number().min(0).required(),
    Interest: Joi.number().min(0).optional(),
    Wholesale: Joi.number().min(0).optional(),
    Other: Joi.number().min(0).optional(),
  }).optional(),
  Values: Joi.object({
    MarketValue: Joi.number().min(0).optional(),
    MSRP: Joi.number().min(0).optional(),
  }).optional(),
  Payment: Joi.object({
    Down: Joi.number().min(0).optional(),
    Weekly: Joi.number().min(0).optional(),
    Monthly: Joi.number().min(0).optional(),
  }).optional(),
  Dates: Joi.object({
    Arrival: Joi.date().optional(),
    ReadytoSell: Joi.date().optional(),
  }).optional(),
  WindowSheetOptions: Joi.object({
    price: Joi.boolean().optional(),
    DownPayment: Joi.boolean().optional(),
    Features: Joi.boolean().optional(),
    SalesComments: Joi.boolean().optional(),
  }).optional(),
  SalesComments: Joi.string().allow('', null).optional(),
})
  .or(
    'Price',
    'Values',
    'Payment',
    'Dates',
    'WindowSheetOptions',
    'SalesComments'
  )
  .messages({
    'object.missing':
      'At least one of the pricing, values, payment, dates, or options fields is required.',
  });
export const addVehiclePreviousOwnerSchema = Joi.object({
  PreviousOwnerDetail: Joi.object({
    OwnerName: optionalString('OWNER_NAME'),
    OwnershipType: enumValidator('OWNERSHIP_TYPE', [
      'Individual',
      'Company-Owned',
      'Leased',
      'Financed',
      'Fleet',
      'Rental',
      'Government-Owned',
    ]),
    ContactNumber: optionalString('CONTACT_NUMBER'),
    Email: Joi.string().email().allow('', null).messages({
      'string.email': errorConstants.VEHICLE.EMAIL_INVALID,
    }),
    Address: optionalString('ADDRESS'),
    StateofRegistration: optionalString('STATE_OF_REGISTRATION').valid(
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
      'Utah'
    ),
    OwnershipStartDate: Joi.date().allow(null),
    OwnershipEndDate: Joi.date().allow(null),
    PrincipleUseofVehicle: optionalString('PRINCIPLE_USE_OF_VEHICLE'),
    Notes: optionalString('NOTES'),
  }).optional(),
  values: Joi.object({
    MarketValue: Joi.number().min(0).optional(),
    MSRP: Joi.number().min(0).optional(),
  }).optional(),
});
export const addVehicleNotesSchema = Joi.object({
  OtherNotes: Joi.object({
    NoteCategory: Joi.string()
      .valid(
        'Buyer Inquiry',
        'Follow-up',
        'New Lead',
        'Call Scheduled',
        'Showroom Visit'
      )
      .optional()
      .messages({
        'any.only': errorConstants.VEHICLE.NOTE_CATEGORY_INVALID,
      }),
    NoteTitle: optionalString('NOTE_TITLE'),
    NoteDetails: optionalString('NOTE_DETAILS'),
  }).optional(),
});

export const editVehicleSchema = addVehicleSchema.fork(
  Object.keys(addVehicleSchema.describe().keys),
  (schema) => schema.optional()
);
