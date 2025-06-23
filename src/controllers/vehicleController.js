import vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import { addVehicleSchema } from '../validations/Vehicle.validation.js';
import extractCategoryCode from '../utils/extractCategory.js';
import SuccessHandler from '../utils/SuccessHandler.js';

// Helper: Convert file path to public URL
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/'); // Windows fix
  const uploadIndex = normalized.indexOf('uploads');
  return uploadIndex !== -1 ? '/' + normalized.slice(uploadIndex) : normalized;
};

// ✅ Add Vehicle Controller
export const addVehicle = async (req, res, next) => {
  try {
    logger.info('🚗 Add vehicle request received');

    // Validate request body
    const { error, value } = addVehicleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      logger.warn({
        message: error.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }

    const {
      basicDetails,
      specifications,
      exteriorInterior,
      titleRegistration,
      inspection,
      keySecurity,
      features,
      vendorInfo,
    } = value;

    // ✅ Handle vendor creation or reuse
    const vendorEmail = vendorInfo?.email?.trim().toLowerCase();
    if (!vendorEmail) {
      return res.status(400).json({ message: 'Vendor email is required' });
    }

    let vendor = await Vendor.findOne({ email: vendorEmail });

    if (vendor) {
      logger.warn({
        message: `❌ Email already exists: ${value.email}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
      ); //
    }
    const categoryCode = extractCategoryCode(vendorInfo.category);
    const count = await Vendor.countDocuments({
      vendorId: new RegExp(`^VEN-${categoryCode}-\\d{4}$`, 'i'),
    });
    const vendorId = `VEN-${categoryCode}-${String(count + 1).padStart(4, '0')}`;
    vendor = new Vendor({
      ...vendorInfo,
      vendorId,
      email: vendorEmail,
      createdBy: req.user?.userId, // If using auth
    });

    await vendor.save();

    // ✅ Process uploaded images
    const featuredImageUrl = toPublicUrl(req.files?.featuredImage?.[0]?.path);
    const otherImageUrls =
      req.files?.otherImages?.map((file) => toPublicUrl(file.path)) || [];

    const vehicleTypeCode = basicDetails?.type?.toUpperCase(); // e.g., "SUV"
    const vehicleCountStock = await vehicle.countDocuments({
      stockId: new RegExp(`^${categoryCode}-${vehicleTypeCode}-\\d{4}$`, 'i'),
    });
    const stockId = `${categoryCode}-${vehicleTypeCode}-${String(vehicleCountStock + 1).padStart(4, '0')}`;
    // ✅ Create and save vehicle
    const newVehicle = new vehicle({
      stockId,
      basicDetails,
      specifications,
      exteriorInterior,
      titleRegistration,
      inspection,
      keySecurity,
      features,
      vendor: vendor._id,
      images: {
        featuredImageUrl,
        otherImageUrls,
      },
    });
    // e.g., "Auction" → "AU"

    await newVehicle.save();

    return SuccessHandler(
      newVehicle.basicDetails,
      200,
      'Vehicle registered successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add vehicle error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
