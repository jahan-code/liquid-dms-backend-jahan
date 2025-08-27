import FloorPlan from '../models/floorPlan.js';
import Vehicle from '../models/vehicle.js';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';
import logger from '../functions/logger.js';
import { addFloorPlanSchema } from '../validations/FloorPlan.validation.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import paginate from '../utils/paginate.js';
import { checkFloorPlanStatusById } from '../utils/floorPlanUtils.js';

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
    // Ensure new floor plans created from the FloorPlan module start as Inactive
    const floorPlan = new FloorPlan({
      CompanyDetails: {
        ...CompanyDetails,
        status: 'Inactive',
      },
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

    // Validate if ID is provided
    if (!id) {
      logger.warn({
        message: '❌ Floor plan ID is required',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Floor plan ID is required', 400));
    }

    const floorPlan = await FloorPlan.findById(id);
    logger.info({
      message: '📦 Loaded floor plan',
      id,
      status: floorPlan?.CompanyDetails?.status,
      updatedAt: floorPlan?.updatedAt,
    });

    if (!floorPlan) {
      logger.warn({
        message: `❌ Floor plan not found for ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.FLOOR_PLAN.FLOOR_PLAN_NOT_FOUND, 404)
      );
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
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.FLOOR_PLAN.FLOOR_PLAN_NOT_FOUND, 404)
      );
    }

    // Check and update floor plan status after edit
    await checkFloorPlanStatusById(id);

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
    logger.info({
      message: '📄 Floor plan list snapshot',
      ids: allFloorPlans.map((f) => f._id.toString()),
      statuses: allFloorPlans.map((f) => f.CompanyDetails?.status),
    });

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

// ✅ Delete FloorPlan Controller
export const deleteFloorPlan = async (req, res, next) => {
  try {
    logger.info('🗑️ Delete floor plan request received');

    const { id } = req.query;

    // Validate if ID is provided
    if (!id) {
      logger.warn({
        message: '❌ Floor plan ID is required for deletion',
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('Floor plan ID is required', 400));
    }

    // Check if floor plan exists before deletion
    const existingFloorPlan = await FloorPlan.findById(id);
    if (!existingFloorPlan) {
      logger.warn({
        message: `❌ Floor plan not found for deletion with ID: ${id}`,
        timestamp: new Date().toISOString(),
      });
      return next(
        new ApiError(errorConstants.FLOOR_PLAN.FLOOR_PLAN_NOT_FOUND, 404)
      );
    }

    // Remove floor plan reference from all vehicles before deletion
    await Vehicle.updateMany(
      { 'floorPlanDetails.floorPlan': id },
      {
        $set: {
          'floorPlanDetails.floorPlan': null,
          'floorPlanDetails.isFloorPlanned': false,
          'floorPlanDetails.isExistingFloor': false,
        },
      }
    );

    // Delete the floor plan
    const deletedFloorPlan = await FloorPlan.findByIdAndDelete(id);

    logger.info({
      message: `✅ Floor plan deleted successfully with ID: ${id}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      { deletedFloorPlan },
      200,
      'Floor plan deleted successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Delete floor plan error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};

// ✅ Show All FloorPlans Paginated Controller
export const showAllFloorPlansPaginated = async (req, res, next) => {
  try {
    logger.info('📄 Show all floor plans (paginated) request received');

    const { page = 1, limit = 10 } = req.query;

    // Use your reusable paginate utility
    const { skip, limit: parsedLimit } = paginate(page, limit);

    // Fetch paginated floor plans, most recent first
    const allFloorPlans = await FloorPlan.find()
      .skip(skip)
      .limit(parsedLimit)
      .sort({ createdAt: -1 }); // Sort by newest first

    // Get total count for pagination info
    const total = await FloorPlan.countDocuments();

    // Create paginated response
    const paginatedResponse = {
      totalFloorPlans: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / parsedLimit),
      floorPlans: allFloorPlans,
      hasNextPage: Number(page) < Math.ceil(total / parsedLimit),
      hasPrevPage: Number(page) > 1,
    };

    // Return empty array if no floor plans found (not an error)
    if (allFloorPlans.length === 0) {
      logger.info({
        message: '📄 No floor plans found in database',
        timestamp: new Date().toISOString(),
      });
    }

    return SuccessHandler(
      paginatedResponse,
      200,
      'Floor plans fetched successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Show all floor plans (paginated) error:', error);
    next(
      new ApiError(
        error.message || errorConstants.GENERAL.INTERNAL_SERVER_ERROR,
        500
      )
    );
  }
};
