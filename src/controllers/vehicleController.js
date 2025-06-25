import Vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import {
  addVehicleSchema,
  editVehicleSchema,
} from '../validations/Vehicle.validation.js';
import extractCategoryCode from '../utils/extractCategory.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import mongoose from 'mongoose';

// 🔧 Convert file path to public URL
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

    // 🔍 Validate request body
    const { error, value } = addVehicleSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
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

    let vendor;
    let categoryCode;

    // 🔁 Reusable bill of sales file logic
    const billofsalesFile = req.files?.billofsales?.[0];
    const billofsalesUrl = billofsalesFile
      ? toPublicUrl(billofsalesFile.path)
      : '';

    // 📦 Handle Existing Vendor
    if (vendorInfo.isExistingVendor) {
      const { vendorId, category } = vendorInfo;

      vendor = await Vendor.findOne({ vendorId });
      if (!vendor) {
        return next(new ApiError('Vendor not found', 404));
      }

      // If a new bill of sales file is uploaded, update vendor
      if (billofsalesUrl) {
        vendor.billofsales = billofsalesUrl;
        await vendor.save();
      }

      categoryCode = extractCategoryCode(category); // Use passed category (not vendor.category)
    }

    // 🆕 Handle New Vendor
    else {
      const vendorEmail = vendorInfo?.email?.trim().toLowerCase();
      const vendorExists = await Vendor.findOne({ email: vendorEmail });
      if (vendorExists) {
        return next(
          new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
        );
      }

      vendorInfo.billofsales = billofsalesUrl;
      categoryCode = extractCategoryCode(vendorInfo.category);

      const count = await Vendor.countDocuments({
        vendorId: new RegExp(`^VEN-${categoryCode}-\\d{4}$`, 'i'),
      });

      const generatedVendorId = `VEN-${categoryCode}-${String(count + 1).padStart(4, '0')}`;
      vendor = new Vendor({
        ...vendorInfo,
        vendorId: generatedVendorId,
        email: vendorEmail,
        createdBy: req.user?.userId,
      });

      await vendor.save();
    }

    // 🖼️ Vehicle Images
    const featuredImageUrl = toPublicUrl(req.files?.featuredImage?.[0]?.path);
    const otherImageUrls =
      req.files?.otherImages?.map((file) => toPublicUrl(file.path)) || [];

    // 🆔 Generate stockId (e.g. DL-SUV-0001)
    const vehicleTypeCode = basicDetails?.vehicleType?.toUpperCase(); // e.g., SUV
    const vehicleCount = await Vehicle.countDocuments({
      stockId: new RegExp(`^${categoryCode}-${vehicleTypeCode}-\\d{4}$`, 'i'),
    });

    const stockId = `${categoryCode}-${vehicleTypeCode}-${String(vehicleCount + 1).padStart(4, '0')}`;

    // 🚙 Save Vehicle
    const newVehicle = new Vehicle({
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

    await newVehicle.save();
    await newVehicle.populate({ path: 'vendor', select: '-taxIdOrSSN' });

    // ✅ Respond
    return SuccessHandler(
      {
        vehicle: newVehicle,
        billofsales: newVehicle.vendor?.billofsales || '',
      },
      200,
      'Vehicle registered successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add vehicle error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const editVehicle = async (req, res, next) => {
  try {
    // ✅ First, parse stringified fields (from multipart/form-data)
    const jsonFields = [
      'basicDetails',
      'specifications',
      'exteriorInterior',
      'titleRegistration',
      'inspection',
      'keySecurity',
      'features',
      'vendorInfo',
    ];

    jsonFields.forEach((field) => {
      const raw = req.body[field];
      if (typeof raw === 'string' && raw.trim() !== '') {
        try {
          req.body[field] = JSON.parse(raw);
        } catch (err) {
          return next(
            new ApiError(`Invalid JSON in ${field}: ${err.message}`, 400)
          );
        }
      }
    });

    // ✅ Validate parsed body using Joi
    const { error, value } = editVehicleSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      logger.warn({
        message: error.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    // ✅ Destructure validated values
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

    const vehicleId = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return next(new ApiError('Invalid vendor ID format', 400));
    }
    if (!vehicleId) {
      return next(new ApiError('Vehicle ID is required in query', 400));
    }

    const existingVehicle =
      await Vehicle.findById(vehicleId).populate('vendor');
    if (!existingVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }
    let vendor = existingVehicle.vendor;

    // ✅ Handle bill of sales upload
    const billofsalesFile = req.files?.billofsales?.[0];
    const billofsalesUrl = billofsalesFile
      ? toPublicUrl(billofsalesFile.path)
      : '';

    // ✅ Vendor logic
    if (vendorInfo.isExistingVendor) {
      const foundVendor = await Vendor.findOne({
        vendorId: vendorInfo.vendorId,
      });
      if (!foundVendor) {
        return next(new ApiError('Vendor not found', 404));
      }

      vendor = foundVendor;

      if (billofsalesUrl) {
        vendor.billofsales = billofsalesUrl;
        await vendor.save();
      }
    } else {
      const vendorEmail = vendorInfo?.email?.trim().toLowerCase();
      const emailConflict = await Vendor.findOne({
        email: vendorEmail,
        _id: { $ne: vendor._id },
      });

      if (emailConflict) {
        return next(
          new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
        );
      }

      vendorInfo.billofsales = billofsalesUrl || vendor.billofsales;
      await Vendor.findByIdAndUpdate(vendor._id, {
        ...vendorInfo,
        email: vendorEmail,
      });
    }

    // ✅ Image Handling
    const featuredImageUrl = req.files?.featuredImage?.[0]?.path
      ? toPublicUrl(req.files.featuredImage[0].path)
      : existingVehicle.images.featuredImageUrl;

    const otherImageUrls =
      req.files?.otherImages?.length > 0
        ? req.files.otherImages.map((f) => toPublicUrl(f.path))
        : existingVehicle.images.otherImageUrls;

    // ✅ Update Vehicle
    let updatedStockId = existingVehicle.stockId;

    const oldCategory = existingVehicle.vendor?.category;
    const newCategory = vendor?.category;

    const oldVehicleType = existingVehicle.basicDetails?.vehicleType;
    const newVehicleType = basicDetails?.vehicleType;

    const categoryChanged = oldCategory !== newCategory;
    const vehicleTypeChanged = oldVehicleType !== newVehicleType;

    if (categoryChanged || vehicleTypeChanged) {
      const categoryCode = extractCategoryCode(newCategory);
      const vehicleTypeCode = newVehicleType.toUpperCase();

      const vehicleCount = await Vehicle.countDocuments({
        stockId: {
          $regex: `^${categoryCode}-${vehicleTypeCode}-\\d{4}$`,
          $options: 'i',
        },
      });

      updatedStockId = `${categoryCode}-${vehicleTypeCode}-${String(vehicleCount + 1).padStart(4, '0')}`;
    }
    existingVehicle.set({
      stockId: updatedStockId,
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

    await existingVehicle.save();
    await existingVehicle.populate({ path: 'vendor', select: '-taxIdOrSSN' });

    // ✅ Respond
    return SuccessHandler(
      {
        vehicle: existingVehicle,
        billofsales: vendor?.billofsales || '',
      },
      200,
      'Vehicle updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Edit vehicle error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
