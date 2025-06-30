import Vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import {
  addVehicleSchema,
  editVehicleSchema,
  AddVehicleCostSchema,
  vehicleIdQuerySchema,
  AddVehicleSalesSchema,
  addVehiclePreviousOwnerSchema,
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

    // Reorder vehicle object for response
    const vehicleObject = newVehicle.toObject();
    const responseVehicle = {
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    // ✅ Respond
    return SuccessHandler(
      {
        vehicle: responseVehicle,
        billofsales: newVehicle.vendor?.billofsales || '',
      },
      201,
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
export const addVehicleCost = async (req, res, next) => {
  try {
    logger.info('💰 Add vehicle Cost request received');

    // 1. Validate vehicle ID from query
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    // 2. Validate request body
    const { error: bodyError, value } = AddVehicleCostSchema.validate(
      req.body,
      {
        abortEarly: false,
      }
    );
    if (bodyError) {
      logger.warn({
        message: bodyError.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(bodyError.details[0].message, 400));
    }

    // 3. Prepare update object for mongoose using dot notation for nested objects
    const updateData = {};
    if (value.costDetails) {
      Object.keys(value.costDetails).forEach((key) => {
        updateData[`costDetails.${key}`] = value.costDetails[key];
      });
    }
    if (value.floorPlanDetails) {
      Object.keys(value.floorPlanDetails).forEach((key) => {
        updateData[`floorPlanDetails.${key}`] = value.floorPlanDetails[key];
      });
    }
    if (value.Curtailments) {
      Object.keys(value.Curtailments).forEach((key) => {
        updateData[`Curtailments.${key}`] = value.Curtailments[key];
      });
    }

    // 4. Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({ path: 'vendor', select: '-taxIdOrSSN' });

    if (!updatedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 5. Reorder vehicle object for response
    const vehicleObject = updatedVehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    // 6. Respond
    return SuccessHandler(
      { vehicle: responseVehicle },
      200,
      'Vehicle Cost Added successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Adding vehicle error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

export const addVehicleSales = async (req, res, next) => {
  try {
    logger.info('💲 Sales request received');

    // 1. Validate vehicle ID from query
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    // 2. Validate request body
    const { error: bodyError, value } = AddVehicleSalesSchema.validate(
      req.body,
      {
        abortEarly: false,
      }
    );
    if (bodyError) {
      logger.warn({
        message: bodyError.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(bodyError.details[0].message, 400));
    }

    // 3. Find the vehicle to update
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 4. Apply updates to the document.
    const updateData = {};
    if (value.Price) {
      Object.keys(value.Price).forEach((key) => {
        updateData[`Price.${key}`] = value.Price[key];
      });
    }
    if (value.Values) {
      Object.keys(value.Values).forEach((key) => {
        updateData[`Values.${key}`] = value.Values[key];
      });
    }
    if (value.Payment) {
      Object.keys(value.Payment).forEach((key) => {
        updateData[`Payement.${key}`] = value.Payment[key];
      });
    }
    if (value.Dates) {
      Object.keys(value.Dates).forEach((key) => {
        updateData[`Dates.${key}`] = value.Dates[key];
      });
    }
    if (value.WindowSheetOptions) {
      Object.keys(value.WindowSheetOptions).forEach((key) => {
        updateData[`WindowSheetOptions.${key}`] = value.WindowSheetOptions[key];
      });
    }
    if (value.Notes) {
      updateData.Notes = value.Notes;
    }
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({ path: 'vendor', select: '-taxIdOrSSN' });
    // 5. Save the updated vehicle

    // 6. Reorder vehicle object for response
    const vehicleObject = updatedVehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    // 7. Respond
    return SuccessHandler(
      { vehicle: responseVehicle },
      200,
      'Vehicle Sales updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update vehicle pricing error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR
      )
    );
  }
};
export const addVehiclePreviousOwner = async (req, res, next) => {
  try {
    logger.info('🔄 Previous owner update request received');

    // 1. Validate vehicle ID from query
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    // 2. Validate request body
    const { error: bodyError, value } = addVehiclePreviousOwnerSchema.validate(
      req.body,
      { abortEarly: false }
    );
    if (bodyError) {
      logger.warn({
        message: bodyError.details.map((d) => d.message).join(', '),
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(bodyError.details[0].message, 400));
    }

    // 3. Construct update object
    const updateData = {};
    if (value.PreviousOwnerDetail) {
      Object.keys(value.PreviousOwnerDetail).forEach((key) => {
        updateData[`PreviousOwnerDetail.${key}`] =
          value.PreviousOwnerDetail[key];
      });
    }
    if (value.values) {
      Object.keys(value.values).forEach((key) => {
        updateData[`values.${key}`] = value.values[key];
      });
    }

    // 4. Handle file upload
    if (req.files && req.files.transferDocument) {
      updateData.transferDocument = toPublicUrl(
        req.files.transferDocument[0].path
      );
    }

    // 5. Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate({ path: 'vendor', select: '-taxIdOrSSN' });

    if (!updatedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 6. Reorder vehicle object for response
    const vehicleObject = updatedVehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    // 7. Respond
    return SuccessHandler(
      { vehicle: responseVehicle },
      200,
      'Vehicle previous owner updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update previous owner error:', error);
    next(new ApiError(error.message, 500));
  }
};

export const editVehicle = async (req, res, next) => {
  try {
    // ✅ Validate request
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
      return next(new ApiError('Invalid vehicle ID format', 400));
    }

    const existingVehicle =
      await Vehicle.findById(vehicleId).populate('vendor');
    if (!existingVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    let vendor = existingVehicle.vendor;

    // ✅ Handle bill of sales file
    const billofsalesFile = req.files?.billofsales?.[0];
    const billofsalesUrl = billofsalesFile
      ? toPublicUrl(billofsalesFile.path)
      : '';

    // ✅ Vendor Handling
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

      // 🔄 Re-fetch vendor
      vendor = await Vendor.findById(vendor._id);
    }

    // ✅ Image Handling
    const featuredImageUrl = req.files?.featuredImage?.[0]?.path
      ? toPublicUrl(req.files.featuredImage[0].path)
      : existingVehicle.images.featuredImageUrl;

    const otherImageUrls =
      req.files?.otherImages?.length > 0
        ? req.files.otherImages.map((f) => toPublicUrl(f.path))
        : existingVehicle.images.otherImageUrls;

    // ✅ Compare category/vehicleType for stockId change
    const oldCategory = (existingVehicle.vendor?.category || '')
      .trim()
      .toLowerCase();
    const newCategory = (vendor?.category || '').trim().toLowerCase();

    const oldVehicleType = (existingVehicle.basicDetails?.vehicleType || '')
      .trim()
      .toLowerCase();
    const newVehicleType = (basicDetails?.vehicleType || '')
      .trim()
      .toLowerCase();

    let updatedStockId = existingVehicle.stockId;

    if (oldCategory !== newCategory || oldVehicleType !== newVehicleType) {
      const categoryCode = extractCategoryCode(vendor.category);
      const vehicleTypeCode = basicDetails.vehicleType.toUpperCase();
      const vehicleCount = await Vehicle.countDocuments({
        stockId: new RegExp(`^${categoryCode}-${vehicleTypeCode}-\\d{4}$`, 'i'),
      });
      updatedStockId = `${categoryCode}-${vehicleTypeCode}-${String(vehicleCount + 1).padStart(4, '0')}`;
    }

    // ✅ Update Vehicle
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

    // Reorder vehicle object for response
    const vehicleObject = existingVehicle.toObject();
    const responseVehicle = {
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    return SuccessHandler(
      {
        vehicle: responseVehicle,
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
