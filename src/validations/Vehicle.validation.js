import Joi from 'joi';
import errorConstants from '../utils/errors.js';
const requiredString = (field) =>
  Joi.string()
    .required()
    .messages({
      'string.base': errorConstants.VEHICLE[`${field}_MUST_BE_STRING`],
      'string.empty': errorConstants.VEHICLE[`${field}_REQUIRED`],
      'any.required': errorConstants.VEHICLE[`${field}_REQUIRED`],
    });
const optionalString = (field) =>
  Joi.string()
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
// Reusable string field

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
  'Crossover',
  'Minivan',
  'Pickup',
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

// Specifications
const transmissionValidator = enumValidator('TRANSMISSION', [
  'Automatic',
  'Manual',
  'CVT',
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
  'AWD',
  'FWD',
  'RWD',
  '4WD',
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
const engineSizeValidator = Joi.string()
  .pattern(/^\d+\.\d+L$/)
  .messages({
    'string.pattern.base': errorConstants.VEHICLE.ENGINE_SIZE_INVALID,
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
const towCapacityValidator = Joi.string()
  .pattern(/^\d+,?\d*\s?(lbs|kg)$/)
  .messages({
    'string.pattern.base': errorConstants.VEHICLE.TOW_CAPACITY_INVALID,
  });
const passengersValidator = Joi.number().integer().min(1).max(100).messages({
  'number.base': errorConstants.VEHICLE.PASSENGERS_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.PASSENGERS_TOO_LOW,
  'number.max': errorConstants.VEHICLE.PASSENGERS_TOO_HIGH,
  'number.integer': errorConstants.VEHICLE.PASSENGERS_INTEGER,
});
const weightValidator = towCapacityValidator;
const mileageValidator = Joi.number().min(0).messages({
  'number.base': errorConstants.VEHICLE.MILEAGE_MUST_BE_NUMBER,
  'number.min': errorConstants.VEHICLE.MILEAGE_NEGATIVE,
});
const mileageIsValidator = enumValidator('MILEAGE_STATUS', [
  'Actual',
  'Not Actual',
  'Exempt',
  'Unknown',
  'TMU',
]);

// Exterior & Interior
const colorValidator = enumValidator('COLOR', [
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

// Title & Registration
const stateValidator = enumValidator('STATE', [
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
  // ... remaining states
]);
const countryValidator = enumValidator('COUNTRY', [
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
]);

// Inspection
const warrantyValidator = enumValidator('WARRANTY', [
  '3 months/3,000 miles',
  '6 months/6,000 miles',
  '12 months/12,000 miles',
  'Factory Warranty Remaining',
  'Extended Warranty Available',
  'Certified Pre-Owned',
]);

export const addVehicleSchema = Joi.object({
  // Section 1: Basic Details
  stockId: optionalString('STOCK_ID'),
  basicDetails: Joi.object({
    vehicleTitle: requiredString('VEHICLE_TITLE'),
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

  // Section 2: Specifications
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
    weight: weightValidator,
    mileage: mileageValidator,
    mileageIs: mileageIsValidator,
  }),

  // Section 3: Exterior & Interior
  exteriorInterior: Joi.object({
    exteriorColor: colorValidator,
    exteriorColor2: colorValidator,
    colorDescription: optionalString('COLOR_DESCRIPTION'),
    interiorColor: interiorColorValidator,
    tag: optionalString('TAG'),
    decal: optionalString('DECAL'),
    gpsSerial: optionalString('GPS_SERIAL'),
  }),

  // Section 4: Title & Registration
  titleRegistration: Joi.object({
    titleApplication: requiredString('TITLE_APPLICATION'),
    titleIn: Joi.boolean().required(),
    stateTitleIn: optionalString('STATE_TITLE_IN'),
    title: optionalString('TITLE'),
    titleDate: Joi.date().optional(),
    country: countryValidator,
  }),

  // Section 5: Inspection
  inspection: Joi.object({
    inspected: Joi.boolean().required(),
    inspectionNumber: optionalString('INSPECTION_NUMBER'),
    inspectionDate: Joi.date().optional(),
    inspectedBy: optionalString('INSPECTED_BY'),
    warranty: warrantyValidator,
    deviceHasStarterInterrupt: Joi.boolean().optional(),
  }),

  // Section 6: Key & Security
  keySecurity: Joi.object({
    ignitionKeyCode: optionalString('IGNITION_KEY_CODE'),
    doorKeyCode: optionalString('DOOR_KEY_CODE'),
    valetKeyCode: optionalString('VALET_KEY_CODE'),
  }),

  // Section 7: Features
  features: Joi.array().items(Joi.string()).optional(),

  // Section 8: Vendor Info
  vendorInfo: Joi.object({
    category: requiredString('CATEGORY'),
    name: requiredString('NAME'),
    street: requiredString('STREET'),
    zip: requiredString('ZIP'),
    city: requiredString('CITY'),
    state: stateValidator,
    primaryContactNumber: requiredString('PRIMARY_CONTACT_NUMBER'),
    contactPerson: requiredString('CONTACT_PERSON'),
    alternativeContactNumber: requiredString('ALTERNATIVE_CONTACT_NUMBER'),
    email: Joi.string().email().required(),
    accountNumber: optionalString('ACCOUNT_NUMBER'),
    taxIdOrSSN: requiredString('TAX_ID_OR_SSN'),
    notes: optionalString('NOTES'),
    billofsales: optionalString('BILL_OF_SALES'),
  }),

  // Section 9: Images (optional, handled by multer usually)
  images: Joi.object({
    featuredImageUrl: requiredString('FEATURED_IMAGE_URL'),
    otherImageUrls: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
});
