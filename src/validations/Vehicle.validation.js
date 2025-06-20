import Joi from 'joi';

// Reusable string field
const optionalString = Joi.string().allow('', null);
const requiredString = Joi.string().required();

export const addVehicleSchema = Joi.object({
  // Section 1: Basic Details
  basicDetails: Joi.object({
    vehicleTitle: requiredString,
    vin: requiredString,
    make: requiredString,
    model: requiredString,
    style: optionalString,
    bodyType: optionalString,
    manufacturingYear: Joi.number()
      .integer()
      .min(1900)
      .max(new Date().getFullYear())
      .optional(),
    vehicleType: optionalString,
    condition: optionalString,
    certified: optionalString,
  }),

  // Section 2: Specifications
  specifications: Joi.object({
    transmission: optionalString,
    tranSpeed: Joi.number().optional(),
    drivetrain: optionalString,
    engineCylinders: Joi.number().optional(),
    engineSize: optionalString,
    fuelType: optionalString,
    mpgCombined: Joi.number().optional(),
    mpgCity: Joi.number().optional(),
    mpgHighway: Joi.number().optional(),
    towCapacity: optionalString,
    passengers: Joi.number().optional(),
    weight: optionalString,
    mileage: Joi.number().optional(),
    mileageIs: optionalString,
  }),

  // Section 3: Exterior & Interior
  exteriorInterior: Joi.object({
    exteriorColor: optionalString,
    exteriorColor2: optionalString,
    colorDescription: optionalString,
    interiorColor: optionalString,
    tag: optionalString,
    decal: optionalString,
    gpsSerial: optionalString,
  }),

  // Section 4: Title & Registration
  titleRegistration: Joi.object({
    titleApplication: optionalString,
    titleIn: Joi.boolean().required(),
    stateTitleIn: optionalString,
    title: optionalString,
    titleDate: Joi.date().optional(),
    county: optionalString,
  }),

  // Section 5: Inspection
  inspection: Joi.object({
    inspected: Joi.boolean().required(),
    inspectionNumber: optionalString,
    inspectionDate: Joi.date().optional(),
    inspectedBy: optionalString,
    warranty: optionalString,
    deviceHasStarterInterrupt: Joi.boolean().optional(),
  }),

  // Section 6: Key & Security
  keySecurity: Joi.object({
    ignitionKeyCode: optionalString,
    doorKeyCode: optionalString,
    valetKeyCode: optionalString,
  }),

  // Section 7: Features
  features: Joi.array().items(Joi.string()).optional(),

  // Section 8: Vendor Info
  vendorInfo: Joi.object({
    category: requiredString,
    name: requiredString,
    street: optionalString,
    zip: optionalString,
    city: optionalString,
    state: optionalString,
    contactNumber: optionalString,
    contactPerson: optionalString,
    alternateContactNumber: optionalString,
    email: Joi.string().email().required(),
    accountNumber: optionalString,
    taxIdOrSSN: optionalString,
    notes: optionalString,
  }),

  // Section 9: Images (optional, handled by multer usually)
  images: Joi.object({
    featuredImageUrl: optionalString,
    otherImageUrls: Joi.array().items(Joi.string().uri()).optional(),
  }).optional(),
});
