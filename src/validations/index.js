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
  editVehicleSchema,
  AddVehicleCostSchema,
  AddVehicleSalesSchema,
  addVehiclePreviousOwnerSchema,
  addVehicleNotesSchema,
} from './Vehicle.validation.js';
import {
  addVendorSchema,
  editVendorSchema,
  getVendorByIdSchema,
} from './Vendor.validation.js';
import { addFloorPlanSchema } from './FloorPlan.validation.js';
import {
  addCustomerSchema,
  editCustomerSchema,
} from './Customer.validation.js';
const validationSchemas = {
  // Authentication

  '/auth/register': { POST: registerSchema },
  '/auth/login': { POST: loginSchema },
  '/auth/forget-password': { POST: forgotPasswordSchema },
  '/auth/verify-otp': { POST: verifyOtpSchema },
  '/auth/reset-password': { POST: resetPasswordSchema },
  '/auth/resend-otp': { POST: resendOtpSchema }, // Or a separate schema if different
  '/health': { health: { GET: null } },

  //Vendor
  '/vendor/add-vendor': { POST: addVendorSchema },
  '/vendor/vendors': { GET: null },
  '/vendor': { GET: getVendorByIdSchema },
  '/vendor/edit-vendor': { PUT: editVendorSchema },
  '/vendor/delete-vendor': { DELETE: getVendorByIdSchema },
  '/vendor/vendors-by-category': { GET: null },
  //Vehicle
  '/vehicle/add-vehicle': { POST: addVehicleSchema },
  '/vehicle/edit': { PUT: editVehicleSchema },
  '/vehicle/Cost': { PUT: AddVehicleCostSchema },
  '/vehicle/Sales': { PUT: AddVehicleSalesSchema },
  '/vehicle/previous-owner': { PUT: addVehiclePreviousOwnerSchema },
  '/vehicle/notes': { POST: addVehicleNotesSchema },

  '/vehicle/complete': { PATCH: null },
  '/vehicle/vehicles': { GET: null },
  '/vehicle': { GET: null },
  '/vehicle/deletebyId': { DELETE: null },
  //FloorPlan
  '/floorPlan/add-floor': { POST: addFloorPlanSchema },
  '/floorPlan': { GET: null },
  '/floorPlan/edit-floor': { PUT: null },
  '/floorPlan/floors': { GET: null },
  //Customer
  '/customer/add-customer': { POST: addCustomerSchema },
  '/customer/edit-customer': { PUT: editCustomerSchema },
  '/customer': { GET: null },
  '/customer/customers': { GET: null },
  '/customer/delete-customer': { DELETE: null },
};

export { validationSchemas };
