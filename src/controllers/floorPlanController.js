import FloorPlan from '../models/floorPlan.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import { addFloorPlanSchema } from '../validations/FloorPlan.validation.js';
import SuccessHandler from '../utils/SuccessHandler.js';

// ✅ Add FloorPlan Controller
export const addFloorPlan = async (req, res, next) => {
  try {
    logger.info('🏢 Add floor plan request received');

    // 🔍 Validate request body from form data
    const { error, value } = addFloorPlanSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }
    const { CompanyDetails, Rate, Fees, term, additionalNotes } = value;
    const existingFloorPlan = await FloorPlan.findOne({
      'CompanyDetails.companyName': value.CompanyDetails.companyName,
    });
    if (existingFloorPlan) {
      logger.warn({
        message: `❌ Floor plan already exists for company: ${value.CompanyDetails.companyName}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.FLOOR_PLAN.COMPANY_ALREADY_EXISTS, 409)
      ); // 409 Conflict
    }
    const floorPlan = new FloorPlan({
      CompanyDetails,
      Rate,
      Fees,
      term,
      additionalNotes,
    });
    // 🏢 Create new FloorPlan
    const FloorPlanResponse = await floorPlan.save();

    // ✅ Respond
    return SuccessHandler(
      FloorPlanResponse,
      200,
      'Floor plan created successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Add floor plan error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const getFloorPlanById = async (req, res, next) => {
  try {
    logger.info('🔍 Get floor plan by ID request received');

    const { id } = req.query;

    const floorPlan = await FloorPlan.findById(id);

    if (!floorPlan) {
      logger.warn({
        message: `❌ Floor plan not found for ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.FLOOR_PLAN.NOT_FOUND, 404));
    }

    return SuccessHandler(
      floorPlan,
      200,
      'Floor plan fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Get floor plan by ID error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
export const editFloorPlan = async (req, res, next) => {
  try {
    logger.info('✏️ Edit floor plan request received');

    const { id } = req.query;

    // Validate input
    const { error, value } = addFloorPlanSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: error.details[0].message,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    const updatedFloorPlan = await FloorPlan.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true }
    );

    if (!updatedFloorPlan) {
      logger.warn({
        message: `❌ Floor plan not found for update with ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(errorConstants.FLOOR_PLAN.NOT_FOUND, 404));
    }

    return SuccessHandler(
      updatedFloorPlan,
      200,
      'Floor plan updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Edit floor plan error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
// ✅ Show All FloorPlans Controller
export const showAllFloorPlans = async (req, res, next) => {
  try {
    logger.info('📄 Show all floor plans request received');

    // 📦 Fetch all floor plans from the database
    const allFloorPlans = await FloorPlan.find();

    if (allFloorPlans.length === 0) {
      logger.warn({
        message: '❌ No floor plans found',
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.FLOOR_PLAN.FLOOR_PLAN_NOT_FOUND, 404)
      );
    }
    // ✅ Send success response
    return SuccessHandler(
      allFloorPlans,
      200,
      'All floor plans fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Show all floor plans error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
