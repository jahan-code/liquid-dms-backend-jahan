import {
  addVendorSchema,
  editVendorSchema,
} from '../validations/Vendor.validation.js';
import vendor from '../models/vendor.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import ApiError from '../utils/ApiError.js';
import user from '../models/user.js';
// import extractCategoryCode from '../utils/extractCategory.js';
import paginate from '../utils/paginate.js';
import { generateVendorId } from '../utils/idGenerator.js';

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

    // category is no longer used for vendorId generation; keep for record only
    const existingVendor = await vendor.findOne({ email: value.email, createdBy: req.user.userId });
    if (existingVendor) {
      logger.warn({
        message: `❌ Email already exists: ${value.email}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
      ); // 409 Conflict
    }

    // Use new vendor ID format: STATE-YYYY-#### (state from value.state)
    const newVendorId = await generateVendorId(value.state, req.user.userId);

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
      .find({ createdBy: req.user.userId })
      .select('-taxIdOrSSN')
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    const total = await vendor.countDocuments({ createdBy: req.user.userId });
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

    const foundVendor = await vendor.findOne({ _id: id, createdBy: req.user.userId });

    if (!foundVendor) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_NOT_FOUND, 404));
    }

    const vendorResponse = {
      vendorId: foundVendor.vendorId,
      name: foundVendor.name,

      email: foundVendor.email,
      street: foundVendor.street,
      city: foundVendor.city,
      state: foundVendor.state,
      zip: foundVendor.zip,
      primaryContactNumber: foundVendor.primaryContactNumber,
      contactPerson: foundVendor.contactPerson,
      alternativeContactNumber: foundVendor.alternativeContactNumber,
      category: foundVendor.category,
      accountNumber: foundVendor.accountNumber,
      taxIdOrSSN: foundVendor.taxIdOrSSN,
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
const editVendor = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_ID_REQUIRED, 400));
    }

    // Validate incoming data
    const { error, value } = editVendorSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.GENERAL.VALIDATION_ERROR, 400));
    }

    const existingVendor = await vendor.findOne({ _id: id, createdBy: req.user.userId });
    if (!existingVendor) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_NOT_FOUND, 404));
    }

    // If email is being updated, ensure it's unique
    if (value.email && value.email !== existingVendor.email) {
      const emailExists = await vendor.findOne({ email: value.email, createdBy: req.user.userId });
      if (emailExists) {
        logger.warn({
          message: `❌ Email already exists: ${value.email}`,
          timestamp: new Date().toISOString(),
        });
        return next(
          new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
        );
      }
    }

    // If category is changed, regenerate vendorId
    if (value.state && value.state !== existingVendor.state) {
      value.vendorId = await generateVendorId(value.state, req.user.userId);
    }

    // Update vendor
    const updatedVendor = await vendor.findOneAndUpdate({ _id: id, createdBy: req.user.userId }, value, {
      new: true,
      runValidators: true,
    });

    logger.info({
      message: `✅ Vendor updated: ${updatedVendor.name}`,
      timestamp: new Date().toISOString(),
    });

    const updatedVendorResponse = {
      vendorId: updatedVendor.vendorId,
      name: updatedVendor.name,
      primaryContactNumber: updatedVendor.primaryContactNumber,
      alternativeContactNumber: updatedVendor.alternativeContactNumber,
      email: updatedVendor.email,
      street: updatedVendor.street,
      city: updatedVendor.city,
      state: updatedVendor.state,
      zip: updatedVendor.zip,
      contact: updatedVendor.contact,
      category: updatedVendor.category,
      accountNumber: updatedVendor.accountNumber,
      taxIdOrSSN: updatedVendor.taxIdOrSSN,
      note: updatedVendor.note,
    };

    return SuccessHandler(
      updatedVendorResponse,
      200,
      'Vendor updated successfully',
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

const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_ID_REQUIRED, 400));
    }

    const existingVendor = await vendor.findOne({ _id: id, createdBy: req.user.userId });
    if (!existingVendor) {
      return next(new ApiError(errorConstants.VENDOR.VENDOR_NOT_FOUND, 404));
    }

    // Delete vendor
    await vendor.findOneAndDelete({ _id: id, createdBy: req.user.userId });

    // Remove vendor from user's vendors list
    await user.findByIdAndUpdate(
      req.user.userId,
      { $pull: { vendors: id } },
      { new: true }
    );

    logger.info({
      message: `✅ Vendor deleted: ${existingVendor.name}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(null, 200, 'Vendor deleted successfully', res);
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

const getVendorsByCategory = async (req, res, next) => {
  try {
    const { category } = req.query;

    if (!category) {
      return next(new ApiError('Category is required', 400));
    }

    // Validate category against enum values
    const validCategories = [
      'Auction - AU',
      'Company - COM',
      'Wholesale - WS',
      'Dealer - DL',
      'Consignment - CT',
      'Private Seller - PS',
      'Manufacturer - MR',
      'Rental Company - RC',
      'Repossession - RE',
      'Trade-In - TI',
    ];

    if (!validCategories.includes(category)) {
      return next(new ApiError('Invalid category provided', 400));
    }

    // Find vendors by category and return only vendorId and name
    const vendors = await vendor
      .find({ category, createdBy: req.user.userId })
      .select('vendorId name category')
      .sort({ name: 1 }); // Sort alphabetically by name

    const response = {
      category,
      totalVendors: vendors.length,
      vendors: vendors.map((vendor) => ({
        vendorId: vendor.vendorId,
        name: vendor.name,
        category: vendor.category,
      })),
    };

    logger.info({
      message: `✅ Vendors fetched for category: ${category}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      response,
      200,
      'Vendors fetched successfully by category',
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

export {
  addVendor,
  showAllVendors,
  getVendorById,
  editVendor,
  deleteVendor,
  getVendorsByCategory,
};
