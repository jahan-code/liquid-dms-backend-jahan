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
import {
  addVendorSchema,
  editVendorSchema,
  getVendorByIdSchema,
} from './Vendor.validation.js';
import { addFloorPlanSchema } from './FloorPlan.validation.js';
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
  '/vendor/edit-vendor': { PUT: editVendorSchema },
  '/vendor/delete-vendor': { DELETE: getVendorByIdSchema },
  //Vehicle
  '/vehicle/add-vehicle': { POST: addVehicleSchema },
  '/vehicle/edit': {
    PUT: {
      query: vehicleIdQuerySchema,
      body: editVehicleSchema,
    },
  },

  '/floorPlan/add-floor': { POST: addFloorPlanSchema },
};

export { validationSchemas };
