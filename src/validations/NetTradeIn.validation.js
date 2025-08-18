import Joi from 'joi';

const nonNegativeNumber = Joi.number().min(0).default(0);

const vehicleBasicDetails = Joi.object({
  vehicleTitle: Joi.string().allow('', null),
  vin: Joi.string().allow('', null),
  make: Joi.string().allow('', null),
  model: Joi.string().allow('', null),
  style: Joi.string().allow('', null),
  bodyType: Joi.string().allow('', null),
  manufacturingYear: Joi.number().integer().allow(null),
  vehicleType: Joi.string().allow('', null),
  condition: Joi.string().allow('', null),
  certified: Joi.string().allow('', null),
});

const vehicleSpecifications = Joi.object({
  transmission: Joi.string().allow('', null),
  tranSpeed: Joi.number().integer().allow(null),
  drivetrain: Joi.string().allow('', null),
  engineCylinders: Joi.number().integer().allow(null),
  engineSize: Joi.string().allow('', null),
  fuelType: Joi.string().allow('', null),
  mpgCombined: Joi.number().allow(null),
  mpgCity: Joi.number().allow(null),
  mpgHighway: Joi.number().allow(null),
  towCapacity: Joi.number().allow(null),
  passengers: Joi.number().integer().allow(null),
  weight: Joi.number().allow(null),
  mileage: Joi.string().allow('', null),
  mileageIs: Joi.string().allow('', null),
});

const vehicleExteriorInterior = Joi.object({
  exteriorColor: Joi.string().allow('', null),
  exteriorColor2: Joi.string().allow('', null),
  colorDescription: Joi.string().allow('', null),
  interiorColor: Joi.string().allow('', null),
  tag: Joi.string().allow('', null),
  decal: Joi.string().allow('', null),
  gpsSerial: Joi.string().allow('', null),
});

const vehicleTitleRegistration = Joi.object({
  titleApplication: Joi.string().allow('', null),
  titleId: Joi.boolean().allow(null),
  stateTitleIn: Joi.string().allow('', null),
  title: Joi.string().allow('', null),
  titleDate: Joi.date().allow(null),
  country: Joi.string().allow('', null),
});

const vehicleInspection = Joi.object({
  inspected: Joi.boolean().allow(null),
  inspectionNumber: Joi.string().allow('', null),
  inspectionDate: Joi.date().allow(null),
  inspectedBy: Joi.string().allow('', null),
  warranty: Joi.string().allow('', null),
  deviceHasStarterInterrupt: Joi.boolean().allow(null),
});

const vehicleKeySecurity = Joi.object({
  ignitionKeyCode: Joi.string().allow('', null),
  doorKeyCode: Joi.string().allow('', null),
  valetKeyCode: Joi.string().allow('', null),
});

const vehicleInfo = Joi.object({
  basicDetails: vehicleBasicDetails,
  specifications: vehicleSpecifications,
  exteriorInterior: vehicleExteriorInterior,
  titleRegistration: vehicleTitleRegistration,
  inspection: vehicleInspection,
  keySecurity: vehicleKeySecurity,
  features: Joi.array().items(Joi.string()).default([]),
  images: Joi.object({
    featuredImageUrl: Joi.string().allow('', null),
    otherImageUrls: Joi.array().items(Joi.string()).default([]),
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
