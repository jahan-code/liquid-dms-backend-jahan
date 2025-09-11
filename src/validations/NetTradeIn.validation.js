import Joi from 'joi';

const nonNegativeNumber = Joi.number().min(0).default(0);

const vehicleBasicDetails = Joi.object({
  vehicleTitle: Joi.string().trim().allow('', null),
  vin: Joi.string().trim().required(),
  make: Joi.string()
    .trim()
    .valid(
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
    )
    .required(),
  model: Joi.string().trim().required(),
  style: Joi.string()
    .valid(
      'Coupe',
      'Sedan',
      'Hatchback',
      'SUV',
      'Van',
      'Convertible',
      'Pickup Truck',
      'Wagon',
      'Minivan',
      'Roadster'
    )
    .required(),
  bodyType: Joi.string().trim().allow('', null),
  manufacturingYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  vehicleType: Joi.string()
    .valid(
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
    )
    .required(),
  condition: Joi.string().valid('New', 'Used', 'Rebuild').required(),
  certified: Joi.string().trim().allow('', null),
});

const vehicleSpecifications = Joi.object({
  transmission: Joi.string()
    .valid(
      'Automatic',
      'Manual',
      'CVT (Continuously Variable Transmission)',
      'Dual-Clutch',
      'Tiptronic',
      'Semi-Automatic'
    )
    .required(),
  tranSpeed: Joi.string().trim().allow('', null),
  drivetrain: Joi.string()
    .valid(
      'FWD (Front-Wheel Drive)',
      'RWD (Rear-Wheel Drive)',
      'AWD (All-Wheel Drive)',
      '4WD (Four-Wheel Drive)'
    )
    .required(),
  engineCylinders: Joi.string().trim().allow('', null),
  engineSize: Joi.number().positive(),
  fuelType: Joi.string()
    .valid('Gas', 'Diesel', 'Electric', 'Hybrid')
    .required(),
  mpgCombined: Joi.string().trim().allow('', null),
  mpgCity: Joi.string().trim().allow('', null),
  mpgHighway: Joi.string().trim().allow('', null),
  towCapacity: Joi.number().min(0),
  passengers: Joi.string().trim().allow('', null),
  weight: Joi.string().trim().allow('', null),
  mileage: Joi.string().trim().required(),
  mileageIs: Joi.string().trim().allow('', null),
});

const vehicleExteriorInterior = Joi.object({
  exteriorColor: Joi.string()
    .valid(
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
      'Beige'
    )
    .required(),
  exteriorColor2: Joi.string().trim().allow('', null),
  colorDescription: Joi.string().trim().allow('', null),
  interiorColor: Joi.string()
    .valid('Black', 'Gray', 'Beige', 'Tan', 'White', 'Brown', 'Red', 'Blue')
    .required(),
  tag: Joi.string().trim().allow('', null),
  decal: Joi.string().trim().allow('', null),
  gpsSerial: Joi.string().trim().allow('', null),
});

const vehicleTitleRegistration = Joi.object({
  titleApplication: Joi.string().trim().required(),
  titleId: Joi.boolean().required(),
  stateTitleIn: Joi.string().trim().allow('', null),
  title: Joi.string().trim().allow('', null),
  titleDate: Joi.string().trim().allow('', null),
  country: Joi.string().trim().allow('', null),
});

const vehicleInspection = Joi.object({
  inspected: Joi.boolean().required(),
  inspectionNumber: Joi.string().trim().allow('', null),
  inspectionDate: Joi.string().trim().allow('', null),
  inspectedBy: Joi.string().trim().allow('', null),
  warranty: Joi.string().trim().allow('', null),
  deviceHasStarterInterrupt: Joi.boolean().optional(),
});

const vehicleKeySecurity = Joi.object({
  ignitionKeyCode: Joi.string().trim().allow('', null),
  doorKeyCode: Joi.string().trim().allow('', null),
  valetKeyCode: Joi.string().trim().allow('', null),
});

const vehicleInfo = Joi.object({
  basicDetails: vehicleBasicDetails,
  specifications: vehicleSpecifications,
  exteriorInterior: vehicleExteriorInterior,
  titleRegistration: vehicleTitleRegistration,
  inspection: vehicleInspection,
  keySecurity: vehicleKeySecurity,
  features: Joi.array().items(Joi.string()).optional(),
  images: Joi.object({
    featuredImageUrl: Joi.string().trim().required(),
    otherImageUrls: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
});

export const addNetTradeInSchema = Joi.object({
  isBuyHerePayHere: Joi.boolean().default(false),
  payoffApplicable: Joi.when('isBuyHerePayHere', {
    is: true,
    then: Joi.boolean().required(),
    otherwise: Joi.forbidden(),
  }),
  tradeInDetails: Joi.object({
    amountAllowed: nonNegativeNumber.required(),
    actualCashValue: nonNegativeNumber.required(),
    previousSoldVehicle: Joi.boolean().default(false),
  }).required(),
  payoffInformation: Joi.when('payoffApplicable', {
    is: true,
    then: Joi.object({
      payoffOwed: Joi.boolean().required(),
      payoffToYou: Joi.boolean().required(),
      accountNumber: Joi.string().allow('', null),
      payoffAmount: nonNegativeNumber,
      payoffToLenderName: Joi.string().allow('', null),
      address: Joi.object({
        street: Joi.string().allow('', null),
        city: Joi.string().allow('', null),
        state: Joi.string().allow('', null),
        zip: Joi.string().allow('', null),
      }).optional(),
      phone: Joi.string().allow('', null),
      quotedBy: Joi.string().allow('', null),
      goodThrough: Joi.date().allow(null),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  vehicleInfo: vehicleInfo.required(),
  addToInventory: Joi.boolean().default(false),
  vendorInfo: Joi.object({
    isExistingVendor: Joi.boolean().default(false),
    vendorId: Joi.string().when('isExistingVendor', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    // New vendor optional fields (will be used if creating a vendor)
    category: Joi.string().optional(),
    name: Joi.string().optional(),
    street: Joi.string().allow('', null).optional(),
    zip: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    primaryContactNumber: Joi.string().optional(),
    alternativeContactNumber: Joi.string().allow('', null).optional(),
    contactPerson: Joi.string().optional(),
    email: Joi.string().email().optional(),
    accountNumber: Joi.string().allow('', null).optional(),
    taxIdOrSSN: Joi.string().optional(),
    note: Joi.string().allow('', null).optional(),
    billofsales: Joi.string().allow('', null).optional(),
  }).optional(),
}).required();

export const editNetTradeInSchema = Joi.object({
  isBuyHerePayHere: Joi.boolean().optional(),
  payoffApplicable: Joi.boolean().optional(),
  tradeInDetails: Joi.object({
    amountAllowed: nonNegativeNumber.optional(),
    actualCashValue: nonNegativeNumber.optional(),
    previousSoldVehicle: Joi.boolean().optional(),
  }).optional(),
  payoffInformation: Joi.when('payoffApplicable', {
    is: true,
    then: Joi.object({
      payoffOwed: Joi.boolean().required(),
      payoffToYou: Joi.boolean().required(),
      accountNumber: Joi.string().allow('', null),
      payoffAmount: nonNegativeNumber,
      payoffToLenderName: Joi.string().allow('', null),
      address: Joi.object({
        street: Joi.string().allow('', null),
        city: Joi.string().allow('', null),
        state: Joi.string().allow('', null),
        zip: Joi.string().allow('', null),
      }).optional(),
      phone: Joi.string().allow('', null),
      quotedBy: Joi.string().allow('', null),
      goodThrough: Joi.date().allow(null),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  vehicleInfo: vehicleInfo.optional(),
  addToInventory: Joi.boolean().optional(),
  vendorInfo: Joi.object({
    isExistingVendor: Joi.boolean().optional(),
    vendorId: Joi.string().optional(),
    category: Joi.string().optional(),
    name: Joi.string().optional(),
    street: Joi.string().optional(),
    zip: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    primaryContactNumber: Joi.string().optional(),
    alternativeContactNumber: Joi.string().optional(),
    contactPerson: Joi.string().optional(),
    email: Joi.string().email().optional(),
    accountNumber: Joi.string().optional(),
    taxIdOrSSN: Joi.string().optional(),
    note: Joi.string().allow('', null).optional(),
    billofsales: Joi.string().allow('', null).optional(),
  }).optional(),
}).optional();
