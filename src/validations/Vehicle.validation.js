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
const transmissionValidator = enumValidator('TRANSMISSION', [
  'Automatic',
  'Manual',
  'CVT (Continuously Variable Transmission)',
  'Dual-Clutch',
  'Tiptronic',
  'Semi-Automatic',
]);

const drivetrainValidator = enumValidator('DRIVETRAIN', [
  'FWD (Front-Wheel Drive)',
  'RWD (Rear-Wheel Drive)',
  'AWD (All-Wheel Drive)',
  '4WD (Four-Wheel Drive)',
]);

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

const towCapacityValidator = Joi.number().min(0).messages({
  'number.base': errorConstants.VEHICLE.TOW_CAPACITY_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.TOW_CAPACITY_NEGATIVE,
});

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
    bodyType: optionalString('BODY_TYPE'),
    manufacturingYear: yearValidator,
    vehicleType: vehicleTypeValidator,
    condition: conditionValidator,
    certified: optionalString('CERTIFIED'),
  }),

  specifications: Joi.object({
    transmission: transmissionValidator,
    tranSpeed: optionalString('TRAN_SPEED'),
    drivetrain: drivetrainValidator,
    engineCylinders: optionalString('ENGINE_CYLINDERS'),
    engineSize: engineSizeValidator,
    fuelType: fuelTypeValidator,
    mpgCombined: optionalString('MPG_COMBINED'),
    mpgCity: optionalString('MPG_CITY'),
    mpgHighway: optionalString('MPG_HIGHWAY'),
    towCapacity: towCapacityValidator,
    passengers: optionalString('PASSENGERS'),
    weight: optionalString('WEIGHT'),
    mileage: requiredString('MILEAGE'),
    mileageIs: optionalString('MILEAGE_IS'),
  }),

  exteriorInterior: Joi.object({
    exteriorColor: colorValidator,
    exteriorColor2: optionalString('EXTERIOR_COLOR_2'),
    colorDescription: optionalString('COLOR_DESCRIPTION'),
    interiorColor: interiorColorValidator,
    tag: requiredString('TAG'),
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
    isExistingFloor: Joi.boolean().default(false), // true = use existing, false = create new (default)
    companyName: Joi.string().optional(), // Company name for existing floor plan lookup
    newFloorPlan: Joi.object({
      CompanyDetails: Joi.object({
        companyName: Joi.string().required(),
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip: Joi.string().required(),
        phone: Joi.string().required(),
        contactPerson: Joi.string().required(),
        status: Joi.string().valid('Active', 'Inactive').default('Active'),
      }).required(),
      Rate: Joi.object({
        apr: Joi.number().min(0).default(0),
        interestCalculationDays: Joi.number().min(0).default(0),
      }).optional(),
      Fees: Joi.object({
        type: Joi.string()
          .valid('One Time', 'Plus for each Curtailment')
          .default('Plus for each Curtailment'),
        adminFee: Joi.number().min(0).default(0),
        setUpFee: Joi.number().min(0).default(0),
        additionalFee: Joi.number().min(0).default(0),
      }).optional(),
      term: Joi.object({
        lengthInDays: Joi.number().min(0).default(0),
        daysUntilFirstCurtailment: Joi.number().min(0).default(0),
        percentPrincipalReduction: Joi.number().min(0).default(0),
        daysUntillSecondCurtailment: Joi.number().min(0).default(0),
        percentPrincipalReduction2: Joi.number().min(0).default(0),
        interestAndFeesWithEachCurtailment: Joi.boolean().default(false),
      }).optional(),
      additionalNotes: Joi.string().default(''),
    }).optional(), // New floor plan data
    dateOpened: Joi.date().allow('').optional(),
    notes: Joi.string().allow('', null).optional(),
  }).optional(),
})
  .or('costDetails', 'floorPlanDetails')
  .messages({
    'object.missing':
      'At least one of costDetails or floorPlanDetails is required.',
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
    Arrival: Joi.date(),
    ReadytoSell: Joi.date().allow('', null).optional(),
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
    OwnerName: Joi.string().allow('', null).optional(),
    OwnershipType: Joi.string().allow('', null).optional(),
    ContactNumber: Joi.string().allow('', null).optional(),
    Email: Joi.string().email().allow('', null).optional(),
    Address: Joi.string().allow('', null).optional(),
    StateofRegistration: Joi.string().allow('', null).optional(),
    OwnershipStartDate: Joi.date().allow('', null).optional(),
    OwnershipEndDate: Joi.date().allow('', null).optional(),
    PrincipleUseofVehicle: Joi.string().allow('', null).optional(),
    Notes: Joi.string().allow('', null).optional(),
    transferDocuments: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
  values: Joi.object({
    MarketValue: Joi.number().min(0).optional(),
    MSRP: Joi.number().min(0).optional(),
  }).optional(),
});
export const addVehicleNotesSchema = Joi.object({
  OtherNotes: Joi.object({
    NoteCategory: Joi.string().allow('', null).optional(),
    NoteTitle: Joi.string().allow('', null).optional(),
    NoteDetails: Joi.string().allow('', null).optional(),
  }).optional(),
  uploadedNotes: Joi.array().items(Joi.string().uri()).optional(),
});

export const editVehicleSchema = addVehicleSchema.fork(
  Object.keys(addVehicleSchema.describe().keys),
  (schema) => schema.optional()
);
