import NetTradeIn from '../models/netTradeIn.js';
import Vehicle from '../models/vehicle.js';
import Vendor from '../models/vendor.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import { getFullImageUrl } from '../utils/url.js';
import logger from '../functions/logger.js';
import {
  addNetTradeInSchema,
  editNetTradeInSchema,
} from '../validations/NetTradeIn.validation.js';
import extractCategoryCode from '../utils/extractCategory.js';
import getNextStockIdForPrefix from '../utils/generateStockId.js';

export const createNetTradeIn = async (req, res, next) => {
  try {
    const { error, value } = addNetTradeInSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return next(new ApiError(error.details[0].message, 400));

    const {
      isBuyHerePayHere,
      tradeInDetails,
      payoffApplicable,
      payoffInformation,
      vehicleInfo,
      addToInventory,
      vendorInfo,
    } = value;

    const featuredImageUrl = req.files?.featuredImage?.[0]?.filename
      ? getFullImageUrl(req.files.featuredImage[0].filename)
      : '';
    const otherImageFiles = [
      ...(req.files?.otherImages || []),
      ...(req.files?.['otherImages[]'] || []),
    ];
    const otherImageUrls = otherImageFiles.map((f) =>
      getFullImageUrl(f.filename)
    );

    let linkedVehicle = null;
    if (addToInventory) {
      let vendorDoc = null;
      const billofsalesFile = req.files?.billofsales?.[0];
      const billofsalesUrl = billofsalesFile
        ? getFullImageUrl(billofsalesFile.filename)
        : '';
      if (vendorInfo?.isExistingVendor && vendorInfo.vendorId) {
        vendorDoc = await Vendor.findOne({ vendorId: vendorInfo.vendorId });
        if (!vendorDoc) return next(new ApiError('Vendor not found', 404));
        if (billofsalesUrl) {
          vendorDoc.billofsales = billofsalesUrl;
          await vendorDoc.save();
        }
      } else {
        const vendorEmail = vendorInfo?.email?.trim().toLowerCase();
        if (!vendorEmail)
          return next(
            new ApiError('Vendor email is required for new vendor', 400)
          );
        const emailExists = await Vendor.findOne({ email: vendorEmail });
        if (emailExists)
          return next(
            new ApiError(errorConstants.VENDOR.EMAIL_ALREADY_EXISTS, 409)
          );

        const categoryCode = extractCategoryCode(vendorInfo?.category);
        const count = await Vendor.countDocuments({
          vendorId: new RegExp(`^VEN-${categoryCode}-\\d{4}$`, 'i'),
        });
        const generatedVendorId = `VEN-${categoryCode}-${String(count + 1).padStart(4, '0')}`;

        vendorDoc = new Vendor({
          category: vendorInfo?.category,
          name: vendorInfo?.name,
          street: vendorInfo?.street,
          zip: vendorInfo?.zip,
          city: vendorInfo?.city,
          state: vendorInfo?.state,
          primaryContactNumber: vendorInfo?.primaryContactNumber,
          alternativeContactNumber: vendorInfo?.alternativeContactNumber,
          contactPerson: vendorInfo?.contactPerson,
          email: vendorEmail,
          accountNumber: vendorInfo?.accountNumber,
          taxIdOrSSN: vendorInfo?.taxIdOrSSN,
          note: vendorInfo?.note,
          billofsales: billofsalesUrl,
          vendorId: generatedVendorId,
          createdBy: req.user?.userId,
        });
        await vendorDoc.save();
      }

      // Generate stockId (atomic, shared with addVehicle)
      const categoryForCode = vendorInfo?.isExistingVendor
        ? vendorInfo?.category || vendorDoc.category
        : vendorInfo?.category;
      const categoryCodeForStock = extractCategoryCode(categoryForCode);
      const vehicleTypeCode = (
        vehicleInfo?.basicDetails?.vehicleType || ''
      ).toUpperCase();
      const stockId = await getNextStockIdForPrefix(
        `${categoryCodeForStock}-${vehicleTypeCode}`
      );

      const newVehicle = new Vehicle({
        stockId,
        basicDetails: vehicleInfo.basicDetails,
        specifications: vehicleInfo.specifications,
        exteriorInterior: vehicleInfo.exteriorInterior,
        titleRegistration: vehicleInfo.titleRegistration,
        inspection: vehicleInfo.inspection,
        keySecurity: vehicleInfo.keySecurity,
        features: vehicleInfo.features,
        vendor: vendorDoc._id,
        images: { featuredImageUrl, otherImageUrls },
        vendorInfo: { isExistingVendor: true },
      });
      await newVehicle.save();
      linkedVehicle = newVehicle._id;
    }

    const netTradeIn = new NetTradeIn({
      isBuyHerePayHere: Boolean(isBuyHerePayHere),
      tradeInDetails,
      payoffInformation: payoffApplicable
        ? { ...payoffInformation, payoffApplicable: true }
        : undefined,
      vehicleInfo,
      images: { featuredImageUrl, otherImageUrls },
      addToInventory: Boolean(addToInventory),
      linkedVehicle,
      createdBy: req.user?._id || req.user?.userId,
    });

    const saved = await netTradeIn.save();
    const populated = await NetTradeIn.findById(saved._id)
      .populate('linkedSales')
      .populate({ path: 'linkedVehicle', populate: { path: 'vendor' } });
    return SuccessHandler(
      populated,
      200,
      'Net Trade-In created successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Create NetTradeIn error:', err);
    return next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

export const listNetTradeIns = async (req, res, next) => {
  try {
    const items = await NetTradeIn.find()
      .populate('linkedSales')
      .populate({ path: 'linkedVehicle', populate: { path: 'vendor' } })
      .sort({ createdAt: -1 });
    return SuccessHandler(
      items,
      200,
      'Net Trade-Ins fetched successfully',
      res
    );
  } catch (err) {
    return next(new ApiError(err.message, 500));
  }
};

export const getNetTradeInById = async (req, res, next) => {
  try {
    const { id } = req.query;
    const item = await NetTradeIn.findById(id)
      .populate('linkedSales')
      .populate({ path: 'linkedVehicle', populate: { path: 'vendor' } });
    if (!item) return next(new ApiError('Net Trade-In not found', 404));
    const doc = item.toObject();
    const response = {
      _id: doc._id,
      isBuyHerePayHere: doc.isBuyHerePayHere,
      tradeInDetails: doc.tradeInDetails,
      payoffInformation: doc.payoffInformation || null,
      addToInventory: doc.addToInventory,
      linkedSales: doc.linkedSales || null,
      linkedVehicle: doc.linkedVehicle || null, // full vehicle with populated vendor
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return SuccessHandler(
      response,
      200,
      'Net Trade-In fetched successfully',
      res
    );
  } catch (err) {
    return next(new ApiError(err.message, 500));
  }
};

export const deleteNetTradeIn = async (req, res, next) => {
  try {
    const { id } = req.query;
    const deleted = await NetTradeIn.findByIdAndDelete(id);
    if (!deleted) return next(new ApiError('Net Trade-In not found', 404));
    return SuccessHandler(null, 200, 'Net Trade-In deleted', res);
  } catch (err) {
    return next(new ApiError(err.message, 500));
  }
};

export const updateNetTradeIn = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return next(new ApiError('Net Trade-In id is required', 400));

    const { error, value } = editNetTradeInSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return next(new ApiError(error.details[0].message, 400));

    const existing = await NetTradeIn.findById(id).populate({
      path: 'linkedVehicle',
      populate: { path: 'vendor' },
    });
    if (!existing) return next(new ApiError('Net Trade-In not found', 404));

    const prevVendorCategory = existing.linkedVehicle?.vendor?.category || null;
    const prevVehicleType =
      existing.linkedVehicle?.basicDetails?.vehicleType || null;

    // Update simple fields
    if (value.isBuyHerePayHere !== undefined)
      existing.isBuyHerePayHere = Boolean(value.isBuyHerePayHere);
    if (value.tradeInDetails)
      existing.tradeInDetails = {
        ...existing.tradeInDetails,
        ...value.tradeInDetails,
      };
    if (value.payoffApplicable === true) {
      existing.payoffInformation = {
        ...(value.payoffInformation || {}),
        payoffApplicable: true,
      };
    } else if (value.payoffApplicable === false) {
      existing.payoffInformation = undefined;
    }

    // If vehicle should be managed
    if (value.addToInventory !== undefined)
      existing.addToInventory = Boolean(value.addToInventory);
    let vehicleDoc = existing.linkedVehicle || null;

    // Vendor/Vehicle updates only if there is a linkedVehicle or addToInventory true
    if (existing.addToInventory) {
      // Images
      const featuredImageUrl = req.files?.featuredImage?.[0]?.filename
        ? getFullImageUrl(req.files.featuredImage[0].filename)
        : vehicleDoc?.images?.featuredImageUrl || '';
      const otherImageFiles = [
        ...(req.files?.otherImages || []),
        ...(req.files?.['otherImages[]'] || []),
      ];
      const otherImageUrls =
        otherImageFiles.length > 0
          ? otherImageFiles.map((f) => getFullImageUrl(f.filename))
          : vehicleDoc?.images?.otherImageUrls || [];

      // Vendor handling
      const vendorInfo = value.vendorInfo;
      let vendorDoc = vehicleDoc?.vendor
        ? await Vendor.findById(vehicleDoc.vendor)
        : null;
      const billofsalesFile = req.files?.billofsales?.[0];
      const billofsalesUrl = billofsalesFile
        ? getFullImageUrl(billofsalesFile.filename)
        : vendorDoc?.billofsales || '';

      if (vendorInfo) {
        if (vendorInfo.isExistingVendor && vendorInfo.vendorId) {
          const found = await Vendor.findOne({ vendorId: vendorInfo.vendorId });
          if (!found) return next(new ApiError('Vendor not found', 404));
          vendorDoc = found;
          if (billofsalesUrl) {
            vendorDoc.billofsales = billofsalesUrl;
            await vendorDoc.save();
          }
        } else if (vendorInfo.isExistingVendor === false) {
          const newEmail = vendorInfo?.email?.trim().toLowerCase();
          const currentEmail = (vendorDoc?.email || '').trim().toLowerCase();
          if (newEmail && (!vendorDoc || newEmail !== currentEmail)) {
            // If another vendor with same email exists, reuse/link that vendor instead of erroring
            const foundByEmail = await Vendor.findOne({ email: newEmail });
            if (
              foundByEmail &&
              (!vendorDoc || String(foundByEmail._id) !== String(vendorDoc._id))
            ) {
              vendorDoc = foundByEmail;
            } else if (!foundByEmail) {
              // No conflict, safe to proceed
            }
          }
          const categoryCode = extractCategoryCode(
            vendorInfo?.category || vendorDoc?.category
          );
          if (!vendorDoc) {
            const count = await Vendor.countDocuments({
              vendorId: new RegExp(`^VEN-${categoryCode}-\\d{4}$`, 'i'),
            });
            const generatedVendorId = `VEN-${categoryCode}-${String(count + 1).padStart(4, '0')}`;
            vendorDoc = await Vendor.create({
              ...vendorInfo,
              email: newEmail || vendorInfo?.email,
              vendorId: generatedVendorId,
              billofsales: billofsalesUrl,
              createdBy: req.user?.userId,
            });
          } else {
            // Update existing vendor doc
            await Vendor.findByIdAndUpdate(
              vendorDoc._id,
              {
                ...vendorInfo,
                email: newEmail || vendorInfo?.email,
                billofsales: billofsalesUrl,
              },
              { new: true, runValidators: true }
            );
            vendorDoc = await Vendor.findById(vendorDoc._id);
          }
        }

        // Ensure vendorId prefix matches current category code; regenerate if mismatched or category changed
        const newVendorCategory = vendorDoc?.category || prevVendorCategory;
        const code = extractCategoryCode(newVendorCategory);
        const expectedVendorIdRegex = new RegExp(`^VEN-${code}-\\d{4}$`, 'i');
        if (!expectedVendorIdRegex.test(vendorDoc.vendorId || '')) {
          const countForCode = await Vendor.countDocuments({
            vendorId: new RegExp(`^VEN-${code}-\\d{4}$`, 'i'),
          });
          vendorDoc.vendorId = `VEN-${code}-${String(countForCode + 1).padStart(4, '0')}`;
          await vendorDoc.save();
        }
      }

      // Vehicle updates
      if (!vehicleDoc) {
        // Create new vehicle if not linked yet
        const categoryCodeForStock = extractCategoryCode(vendorDoc?.category);
        const vehicleTypeCode = (
          value.vehicleInfo?.basicDetails?.vehicleType ||
          existing.vehicleInfo?.basicDetails?.vehicleType ||
          ''
        ).toUpperCase();
        const stockId = await getNextStockIdForPrefix(
          `${categoryCodeForStock}-${vehicleTypeCode}`
        );
        vehicleDoc = await Vehicle.create({
          stockId,
          basicDetails:
            value.vehicleInfo?.basicDetails ||
            existing.vehicleInfo?.basicDetails,
          specifications:
            value.vehicleInfo?.specifications ||
            existing.vehicleInfo?.specifications,
          exteriorInterior:
            value.vehicleInfo?.exteriorInterior ||
            existing.vehicleInfo?.exteriorInterior,
          titleRegistration:
            value.vehicleInfo?.titleRegistration ||
            existing.vehicleInfo?.titleRegistration,
          inspection:
            value.vehicleInfo?.inspection || existing.vehicleInfo?.inspection,
          keySecurity:
            value.vehicleInfo?.keySecurity || existing.vehicleInfo?.keySecurity,
          features:
            value.vehicleInfo?.features || existing.vehicleInfo?.features,
          vendor: vendorDoc?._id,
          images: { featuredImageUrl, otherImageUrls },
          vendorInfo: {
            isExistingVendor: Boolean(vendorInfo?.isExistingVendor),
          },
        });
        existing.linkedVehicle = vehicleDoc._id;
      } else {
        // Update existing vehicle
        const basicDetails = value.vehicleInfo?.basicDetails;
        const newVehicleType = basicDetails?.vehicleType || prevVehicleType;
        let stockId = vehicleDoc.stockId;
        // Recompute stockId if vendor category or vehicleType changed compared to previous values
        const updatedVendorCategory =
          vendorDoc?.category || prevVendorCategory || '';
        const changedCategory =
          prevVendorCategory &&
          updatedVendorCategory &&
          prevVendorCategory.trim().toLowerCase() !==
            updatedVendorCategory.trim().toLowerCase();
        const prevTypeLower = (prevVehicleType || '').trim().toLowerCase();
        const newTypeLower = (newVehicleType || prevVehicleType || '')
          .trim()
          .toLowerCase();
        const changedType = prevTypeLower !== newTypeLower;
        const categoryCodeForStock = extractCategoryCode(updatedVendorCategory);
        const vehicleTypeCode = (
          newVehicleType ||
          vehicleDoc.basicDetails?.vehicleType ||
          ''
        ).toUpperCase();
        const expectedStockIdRegex = new RegExp(
          `^${categoryCodeForStock}-${vehicleTypeCode}-\\d{4}$`,
          'i'
        );
        if (
          changedCategory ||
          changedType ||
          !expectedStockIdRegex.test(stockId || '')
        ) {
          stockId = await getNextStockIdForPrefix(
            `${categoryCodeForStock}-${vehicleTypeCode}`
          );
        }
        await Vehicle.findByIdAndUpdate(
          vehicleDoc._id,
          {
            stockId,
            basicDetails: {
              ...(vehicleDoc.basicDetails.toObject?.() ||
                vehicleDoc.basicDetails),
              ...(value.vehicleInfo?.basicDetails || {}),
            },
            specifications: {
              ...(vehicleDoc.specifications.toObject?.() ||
                vehicleDoc.specifications),
              ...(value.vehicleInfo?.specifications || {}),
            },
            exteriorInterior: {
              ...(vehicleDoc.exteriorInterior.toObject?.() ||
                vehicleDoc.exteriorInterior),
              ...(value.vehicleInfo?.exteriorInterior || {}),
            },
            titleRegistration: {
              ...(vehicleDoc.titleRegistration.toObject?.() ||
                vehicleDoc.titleRegistration),
              ...(value.vehicleInfo?.titleRegistration || {}),
            },
            inspection: {
              ...(vehicleDoc.inspection.toObject?.() || vehicleDoc.inspection),
              ...(value.vehicleInfo?.inspection || {}),
            },
            keySecurity: {
              ...(vehicleDoc.keySecurity.toObject?.() ||
                vehicleDoc.keySecurity),
              ...(value.vehicleInfo?.keySecurity || {}),
            },
            features: value.vehicleInfo?.features || vehicleDoc.features,
            vendor: vendorDoc?._id || vehicleDoc.vendor,
            images: { featuredImageUrl, otherImageUrls },
            vendorInfo: {
              isExistingVendor: Boolean(
                vendorInfo?.isExistingVendor ??
                  vehicleDoc.vendorInfo?.isExistingVendor
              ),
            },
          },
          { new: true, runValidators: true }
        );
      }
    }

    await existing.save();
    const populated = await NetTradeIn.findById(existing._id)
      .populate('linkedSales')
      .populate({ path: 'linkedVehicle', populate: { path: 'vendor' } });
    return SuccessHandler(
      populated,
      200,
      'Net Trade-In updated successfully',
      res
    );
  } catch (err) {
    logger.error('❌ Update NetTradeIn error:', err);
    return next(
      new ApiError(
        err.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
