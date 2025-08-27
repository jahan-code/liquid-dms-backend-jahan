import Vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import FloorPlan from '../models/floorPlan.js';
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
  addVehicleNotesSchema,
} from '../validations/Vehicle.validation.js';
import extractCategoryCode from '../utils/extractCategory.js';
import { generateStockId, generateVendorId } from '../utils/idGenerator.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import mongoose from 'mongoose';
import paginate from '../utils/paginate.js';
import { getFullImageUrl } from '../utils/url.js';
import {
  checkFloorPlanStatusForVehicle,
  checkFloorPlanStatusById,
} from '../utils/floorPlanUtils.js';

// 🔧 Convert file path to public URL

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
      ? getFullImageUrl(billofsalesFile.filename)
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

      const generatedVendorId = await generateVendorId(categoryCode);
      vendor = new Vendor({
        ...vendorInfo,
        vendorId: generatedVendorId,
        email: vendorEmail,
        createdBy: req.user?.userId,
      });

      await vendor.save();
    }

    // 🖼️ Vehicle Images
    const featuredImageUrl = req.files?.featuredImage?.[0]?.filename
      ? getFullImageUrl(req.files.featuredImage[0].filename)
      : '';
    const otherImageFiles = [
      ...(req.files?.otherImages || []),
      ...(req.files?.['otherImages[]'] || []),
    ];
    const otherImageUrls = otherImageFiles.map((file) =>
      getFullImageUrl(file.filename)
    );

    // 🆔 Generate stockId (atomic, shared with NetTradeIn)
    const vehicleTypeCode = basicDetails?.vehicleType?.toUpperCase(); // e.g., SUV
    const stockId = await generateStockId(`${categoryCode}-${vehicleTypeCode}`);

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
      vendorInfo: {
        isExistingVendor: vendorInfo.isExistingVendor,
      },
    });

    await newVehicle.save();
    await newVehicle.populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

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
export const addVehicleCost = async (req, res, next) => {
  try {
    logger.info('💰 Add vehicle Cost request received');

    // New Floor Plan Logic:
    // 1. isExistingFloor = true: Use existing floor plan (provide companyName)
    // 2. isExistingFloor = false (default): Create new floor plan (provide newFloorPlan object)
    // 3. Floor plan data (company details, rates, fees, terms) is stored in FloorPlan collection
    // 4. Vehicle only stores reference to floor plan, not the actual data
    // 5. When companyName is provided, it automatically finds and references the existing floor plan

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
    let updatedAddedCosts = [];
    if (value.costDetails) {
      // Fetch the current vehicle to get existing addedCosts if needed
      let existingVehicle = null;
      if (!value.costDetails.addedCosts) {
        existingVehicle = await Vehicle.findById(vehicleId).select(
          'costDetails.addedCosts'
        );
      }
      // Use the new addedCosts if provided, otherwise use the existing ones
      if (Array.isArray(value.costDetails.addedCosts)) {
        updatedAddedCosts = value.costDetails.addedCosts;
      } else if (
        existingVehicle &&
        Array.isArray(existingVehicle.costDetails?.addedCosts)
      ) {
        updatedAddedCosts = existingVehicle.costDetails.addedCosts;
      }
      // Calculate the sum of all addedCosts[].cost
      const addedCostsTotal = updatedAddedCosts.reduce((sum, item) => {
        const cost = typeof item.cost === 'number' ? item.cost : 0;
        return sum + cost;
      }, 0);
      value.costDetails.addedCostsTotal = addedCostsTotal;
      // If we fetched existing addedCosts, make sure to update them in the DB if not present in the request
      if (!value.costDetails.addedCosts && updatedAddedCosts.length > 0) {
        value.costDetails.addedCosts = updatedAddedCosts;
      }
      Object.keys(value.costDetails).forEach((key) => {
        updateData[`costDetails.${key}`] = value.costDetails[key];
      });
    }
    if (value.floorPlanDetails) {
      // Remove deprecated fields if present
      if (value.floorPlanDetails.dateOpened === '') {
        delete value.floorPlanDetails.dateOpened;
      }

      // Handle floor plan logic
      if (value.floorPlanDetails.isFloorPlanned) {
        let floorPlanId = null;

        // Fetch current vehicle's existing floor plan link (if any)
        const currentVehicleLink = await Vehicle.findById(vehicleId).select(
          'floorPlanDetails.floorPlan'
        );

        // Check if using existing floor plan or creating/updating one
        if (value.floorPlanDetails.isExistingFloor === true) {
          // Use existing floor plan
          if (value.floorPlanDetails.companyName) {
            const rawName = String(
              value.floorPlanDetails.companyName || ''
            ).trim();
            const escaped = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existingFloorPlan = await FloorPlan.findOne({
              'CompanyDetails.companyName': {
                $regex: new RegExp(`^${escaped}$`, 'i'),
              },
            });

            if (!existingFloorPlan) {
              return next(
                new ApiError(
                  `Floor plan company '${value.floorPlanDetails.companyName}' not found`,
                  404
                )
              );
            }
            floorPlanId = existingFloorPlan._id;
            // Ensure existing floor plan becomes Active when a vehicle uses it
            await FloorPlan.findByIdAndUpdate(floorPlanId, {
              'CompanyDetails.status': 'Active',
            });
          } else {
            return next(
              new ApiError(
                'companyName is required when using existing floor plan',
                400
              )
            );
          }
        } else {
          // Default path: create new OR update current linked floor plan if already linked
          const hasLinkedFloorPlan = Boolean(
            currentVehicleLink?.floorPlanDetails?.floorPlan
          );

          if (hasLinkedFloorPlan) {
            // Update the existing linked floor plan with provided fields
            const linkedId = currentVehicleLink.floorPlanDetails.floorPlan;

            // Attach dateOpened if provided at top level
            if (value.floorPlanDetails.dateOpened) {
              value.floorPlanDetails.newFloorPlan = {
                ...(value.floorPlanDetails.newFloorPlan || {}),
                CompanyDetails: {
                  ...(value.floorPlanDetails.newFloorPlan?.CompanyDetails ||
                    {}),
                  dateOpened: value.floorPlanDetails.dateOpened,
                },
              };
            }

            await FloorPlan.findByIdAndUpdate(
              linkedId,
              value.floorPlanDetails.newFloorPlan || {},
              { new: true }
            );

            floorPlanId = linkedId;
          } else {
            // Create a brand new floor plan (first-time link for this vehicle)
            if (!value.floorPlanDetails.newFloorPlan) {
              return next(
                new ApiError(
                  'newFloorPlan is required when creating new floor plan',
                  400
                )
              );
            }

            // ✅ Duplicate check only on create
            const newCompanyName =
              value.floorPlanDetails.newFloorPlan.CompanyDetails?.companyName;
            if (newCompanyName) {
              const existingFloorPlanWithSameName = await FloorPlan.findOne({
                'CompanyDetails.companyName': newCompanyName,
              });

              if (existingFloorPlanWithSameName) {
                logger.warn({
                  message: `❌ Floor plan already exists for company: ${newCompanyName}`,
                  timestamp: new Date().toISOString(),
                });
                return next(
                  new ApiError(
                    `Floor plan already exists for company '${newCompanyName}'. Please use existing floor plan or choose a different company name.`,
                    409
                  )
                );
              }
            }

            // Ensure dateOpened is set in CompanyDetails if provided at the top level
            if (value.floorPlanDetails.dateOpened) {
              value.floorPlanDetails.newFloorPlan.CompanyDetails = {
                ...value.floorPlanDetails.newFloorPlan.CompanyDetails,
                dateOpened: value.floorPlanDetails.dateOpened,
              };
            }

            const newFloorPlan = new FloorPlan({
              ...value.floorPlanDetails.newFloorPlan,
              CompanyDetails: {
                ...value.floorPlanDetails.newFloorPlan.CompanyDetails,
                status: 'Active', // Vehicle-created floor plan should start Active
              },
            });
            const savedFloorPlan = await newFloorPlan.save();
            floorPlanId = savedFloorPlan._id;

            logger.info({
              message: `✅ New floor plan created for company: ${newCompanyName}`,
              timestamp: new Date().toISOString(),
              floorPlanId: floorPlanId.toString(),
            });
          }
        }

        // Update the floor plan reference and flags on the vehicle
        updateData['floorPlanDetails.floorPlan'] = floorPlanId;
        updateData['floorPlanDetails.isFloorPlanned'] = true;
        updateData['floorPlanDetails.isExistingFloor'] = Boolean(
          value.floorPlanDetails.isExistingFloor
        );
      } else {
        // If not floor planned, clear the floor plan reference and flags
        updateData['floorPlanDetails.isFloorPlanned'] = false;
        updateData['floorPlanDetails.isExistingFloor'] = false;
        updateData['floorPlanDetails.floorPlan'] = null;
      }
    }

    // 4. Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

    if (!updatedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 5.a Force-persist Active on the linked floor plan (guard against any race/merge issues)
    const linkedId = updateData['floorPlanDetails.floorPlan'];
    if (linkedId) {
      await FloorPlan.findByIdAndUpdate(linkedId, {
        'CompanyDetails.status': 'Active',
      });
    }

    // 5. Check and update floor plan status after vehicle update
    await checkFloorPlanStatusForVehicle(vehicleId);

    // 6. Reorder vehicle object for response
    const vehicleObject = updatedVehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    // 7. Respond
    return SuccessHandler(
      {
        vehicle: responseVehicle,
        addedCostsTotal: responseVehicle.costDetails?.addedCostsTotal || 0,
      },
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
    if (value.SalesComments !== undefined) {
      updateData.SalesComments = value.SalesComments;
    }
    if (value.Notes) {
      updateData.Notes = value.Notes;
    }
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);
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
      updateData.transferDocument = getFullImageUrl(
        req.files.transferDocument[0].filename
      );
    }

    // 5. Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

    if (!updatedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // Merge files from both field names
    const transferDocs = [
      ...(req.files?.transferDocument || []),
      ...(req.files?.['transferDocument[]'] || []),
    ];
    const transferDocUrls = transferDocs.map((f) =>
      getFullImageUrl(f.filename)
    );

    // Set inside PreviousOwnerDetail
    if (!updatedVehicle.PreviousOwnerDetail) {
      updatedVehicle.PreviousOwnerDetail = {};
    }
    updatedVehicle.PreviousOwnerDetail.transferDocuments = transferDocUrls;

    await updatedVehicle.save();

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
export const addVehicleNotes = async (req, res, next) => {
  try {
    logger.info('📝 Vehicle notes update request received');

    // 1. Validate vehicle ID from query
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    const { error: bodyError, value } = addVehicleNotesSchema.validate(
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

    // 3. Construct update object for nested OtherNotes
    const updateData = {};
    if (value.OtherNotes) {
      Object.keys(value.OtherNotes).forEach((key) => {
        updateData[`OtherNotes.${key}`] = value.OtherNotes[key];
      });
    }

    // 4. Handle file upload for uploadedNotes (single or multiple files expected)
    const uploadedNotesFiles = [
      ...(req.files?.uploadedNotes || []),
      ...(req.files?.['uploadedNotes[]'] || []),
    ];
    const uploadedNotesUrls = uploadedNotesFiles.map((f) =>
      getFullImageUrl(f.filename)
    );
    if (uploadedNotesUrls.length > 0) {
      updateData.uploadedNotes = uploadedNotesUrls; // <-- Top-level field
    }

    // 5. Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

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
      'Vehicle notes updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update vehicle notes error:', error);
    next(new ApiError(error.message, 500));
  }
};
export const markVehicleAsCompleted = async (req, res, next) => {
  try {
    logger.info('✅ Mark vehicle as completed request received');

    // 1. Validate vehicle ID from query
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    // 2. Update markAsCompleted field
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $set: { markAsCompleted: true, salesStatus: 'Available' } },
      { new: true, runValidators: true }
    ).populate([
      { path: 'vendor', select: '-taxIdOrSSN' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

    if (!updatedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 4. Format response
    const vehicleObject = updatedVehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
    };

    return SuccessHandler(
      { vehicle: responseVehicle },
      200,
      'Vehicle marked as completed successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Mark vehicle as completed error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const getAllVehicles = async (req, res, next) => {
  try {
    logger.info('📄 Fetching all vehicles');

    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: parsedLimit } = paginate(page, limit);

    // Fetch all vehicles regardless of completion status
    const vehicles = await Vehicle.find({})
      .populate([
        { path: 'vendor', select: '-taxIdOrSSN' },
        { path: 'floorPlanDetails.floorPlan' },
      ])
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 });

    const total = await Vehicle.countDocuments({});

    const vehiclesWithFlags = vehicles.map((vehicle) => {
      const vehicleObject = vehicle.toObject();
      return {
        _id: vehicleObject._id,
        stockId: vehicleObject.stockId,
        ...vehicleObject,
        vendorInfo: {
          isExistingVendor: vehicleObject.vendorInfo?.isExistingVendor,
        },
        floorPlanDetails: {
          ...vehicleObject.floorPlanDetails,
          isExistingFloor: vehicleObject.floorPlanDetails?.isExistingFloor,
        },
      };
    });

    const response = {
      totalVehicles: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / parsedLimit),
      vehicles: vehiclesWithFlags,
    };

    return SuccessHandler(
      response,
      200,
      'All vehicles fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Error fetching all vehicles:', error);
    return next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const getVehicleById = async (req, res, next) => {
  try {
    logger.info('🔍 Get vehicle by ID request received');

    // 1. Validate vehicle ID
    const { error: queryError } = vehicleIdQuerySchema.validate(req.query);
    if (queryError) {
      return next(new ApiError(queryError.details[0].message, 400));
    }
    const { id: vehicleId } = req.query;

    // 2. Fetch vehicle
    const vehicle = await Vehicle.findById(vehicleId).populate([
      { path: 'vendor' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

    if (!vehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 3. Prepare response
    const vehicleObject = vehicle.toObject();
    const responseVehicle = {
      _id: vehicleObject._id,
      stockId: vehicleObject.stockId,
      ...vehicleObject,
      vendorInfo: {
        isExistingVendor: vehicleObject.vendorInfo?.isExistingVendor,
      },
      floorPlanDetails: {
        ...vehicleObject.floorPlanDetails,
        isExistingFloor: vehicleObject.floorPlanDetails?.isExistingFloor,
      },
    };

    return SuccessHandler(
      { vehicle: responseVehicle },
      200,
      'Vehicle fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Get vehicle by ID error:', error);
    next(new ApiError(error.message, 500));
  }
};
export const deleteVehicleById = async (req, res, next) => {
  try {
    logger.info('🗑️ Delete vehicle by ID request received');

    // 1. Validate query
    const { error } = vehicleIdQuerySchema.validate(req.query);
    if (error) {
      return next(new ApiError(error.details[0].message, 400));
    }

    const { id: vehicleId } = req.query;

    // 2. Delete the vehicle and retrieve the deleted document
    const deletedVehicle = await Vehicle.findByIdAndDelete(vehicleId);

    if (!deletedVehicle) {
      return next(new ApiError('Vehicle not found', 404));
    }

    // 3. Check floor plan status after deleting vehicle
    const floorPlanId = deletedVehicle.floorPlanDetails?.floorPlan;
    if (floorPlanId) {
      await checkFloorPlanStatusById(floorPlanId);
    }

    return SuccessHandler(null, 200, 'Vehicle deleted successfully', res);
  } catch (error) {
    logger.error('❌ Delete vehicle error:', error);
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
      ? getFullImageUrl(billofsalesFile.filename)
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
    const featuredImageUrl = req.files?.featuredImage?.[0]?.filename
      ? getFullImageUrl(req.files.featuredImage[0].filename)
      : existingVehicle.images.featuredImageUrl;

    const otherImageFiles = [
      ...(req.files?.otherImages || []),
      ...(req.files?.['otherImages[]'] || []),
    ];
    const otherImageUrls = otherImageFiles.map((file) =>
      getFullImageUrl(file.filename)
    );

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
      updatedStockId = await generateStockId(
        `${categoryCode}-${vehicleTypeCode}`
      );
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
      vendorInfo: {
        isExistingVendor: vendorInfo.isExistingVendor,
      },
    });

    await existingVehicle.save();
    await existingVehicle.populate([
      { path: 'vendor' },
      { path: 'floorPlanDetails.floorPlan' },
    ]);

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
