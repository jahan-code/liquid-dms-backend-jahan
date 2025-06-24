import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from './auth.validation.js';
import {
  addVehicleSchema,
  vehicleIdQuerySchema,
  editVehicleSchema,
} from './Vehicle.validation.js';
import { addVendorSchema, getVendorByIdSchema } from './Vendor.validation.js';

const validationSchemas = {
  // Authentication

  '/auth/register': { POST: registerSchema },
  '/auth/login': { POST: loginSchema },
  '/auth/forget-password': { POST: forgotPasswordSchema },
  '/auth/verify-otp': { POST: verifyOtpSchema },
  '/auth/reset-password': { POST: resetPasswordSchema },
  '/auth/resend-otp': { POST: resendOtpSchema },
  '/health': { health: { GET: null } },

  //Vendor
  '/vendor/add-vendor': { POST: addVendorSchema },
  '/vendor/vendors': { GET: null },
  '/vendor': { GET: getVendorByIdSchema },

  //Vehicle
  '/vehicle/add-vehicle': { POST: addVehicleSchema },
  '/vehicle/edit': {
    PUT: {
      query: vehicleIdQuerySchema,
      body: editVehicleSchema,
    },
  },
};

export { validationSchemas };
