import { addVendorSchema } from '../validations/Vendor.validation.js';
import vendor from '../models/vendor.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import ApiError from '../utils/ApiError.js';
import user from '../models/user.js';
import extractCategoryCode from '../utils/extractCategory.js';
import paginate from '../utils/paginate.js';

const addVendor = async (req, res, next) => {
  try {
    const { error, value } = addVendorSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }

    const categoryCode = extractCategoryCode(value.category);
    const count = await vendor.countDocuments({
      vendorId: new RegExp(`^VEN-${categoryCode}-\\d{4}$`, 'i'),
    });
    const existingVendor = await vendor.findOne({ email: value.email });
    if (existingVendor) {
      logger.warn({
        message: `❌ Email already exists: ${value.email}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
      ); // 409 Conflict
    }
    const newVendorId = `VEN-${categoryCode}-${String(count + 1).padStart(4, '0')}`;

    // ✅ Create and save vendor
    const newVendor = await vendor.create({
      ...value,
      vendorId: newVendorId,
      createdBy: req.user.userId, // assuming this is coming from auth middleware
    });

    // 🔁 Add vendor to user's vendors list
    await user.findByIdAndUpdate(
      req.user.userId,
      { $push: { vendors: newVendor._id } },
      { new: true }
    );

    logger.info({
      message: `✅ Vendor added: ${newVendor.name}`,
      timestamp: new Date().toISOString(),
    });
    const newVendorResponse = {
      id: newVendor._id,
      vendorId: newVendor.vendorId,

      personalInfo: {
        name: newVendor.name,
        primaryContactNumber: newVendor.primaryContactNumber,
        email: newVendor.email,
        city: newVendor.city,
      },
      address: {
        street: newVendor.street,
        zip: newVendor.zip,
        city: newVendor.city,
        state: newVendor.state,
      },
    };
    return SuccessHandler(
      newVendorResponse,
      200,
      'Vendor registered successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

const showAllVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const { skip, limit: parsedLimit } = paginate(page, limit);

    const vendors = await vendor
      .find()
      .select('-taxIdOrSSN')
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    const total = await vendor.countDocuments();
    const showVendorsResponse = {
      totalVendors: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / parsedLimit),
      vendors,
    };
    return SuccessHandler(
      showVendorsResponse,
      200,
      'Vendors fetched successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
// controller
const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_ID_REQUIRED, 400));
    }

    const foundVendor = await vendor.findById(id).select('-taxIdOrSSN');

    if (!foundVendor) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_NOT_FOUND, 404));
    }

    const vendorResponse = {
      vendorId: foundVendor.vendorId,
      name: foundVendor.name,
      phone: foundVendor.primaryContactNumber,
      email: foundVendor.email,
      street: foundVendor.street,
      city: foundVendor.city,
      state: foundVendor.state,
      zip: foundVendor.zip,
      contact: foundVendor.contact,
      category: foundVendor.category,
      accountNumber: foundVendor.accountNumber,
      note: foundVendor.note,
    };

    return SuccessHandler(
      vendorResponse,
      200,
      'Vendor fetched successfully',
      res
    );
  } catch (error) {
    logger.error({
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    next(new ApiError('Internal Server Error', 500));
  }
};

export default { addVendor, showAllVendors, getVendorById };
