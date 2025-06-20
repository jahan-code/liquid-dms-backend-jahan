import logger from '../functions/logger.js';
import vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import { addVehicleSchema } from '../validations/Vehicle.validation.js';

// Add Vehicle Controller
export const addVehicle = async (req, res, next) => {
  try {
    console.log('🚀 Vehicle add request received');
    const { error, value } = addVehicleSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
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
      vendorInfo, // custom key from frontend for vendor creation
    } = value;

    // Ensure vendor email exists
    const vendorEmail = vendorInfo.email?.trim().toLowerCase();
    if (!vendorEmail) {
      return res.status(400).json({ message: 'Vendor email is required' });
    }

    // Check if vendor already exists
    let vendor = await Vendor.findOne({ email: vendorEmail });

    // Create new vendor if not found
    if (!vendor) {
      vendor = new Vendor({
        category: vendorInfo.category,
        name: vendorInfo.name,
        street: vendorInfo.street,
        zip: vendorInfo.zip,
        city: vendorInfo.city,
        state: vendorInfo.state,
        phone: vendorInfo.contactNumber,
        contactPerson: vendorInfo.contactPerson,
        otherPhone: vendorInfo.alternateContactNumber,
        email: vendorEmail,
        accountNumber: vendorInfo.accountNumber,
        taxIdOrSSN: vendorInfo.taxIdOrSSN,
        note: vendorInfo.notes,
        createdBy: req.user?._id, // Optional: if using auth
      });

      await vendor.save();
    }

    // File uploads (if using multer)
    const featuredImageUrl = req.files?.featuredImage?.[0]?.path || null;
    const otherImageUrls =
      req.files?.otherImages?.map((file) => file.path) || [];

    // Create new vehicle entry
    const newVehicle = new vehicle({
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

    res.status(201).json({
      message: 'Vehicle added successfully',
      data: newVehicle,
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
