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

    const floorPlanData = value;

    // 🏢 Create new FloorPlan
    const floorPlan = new FloorPlan(floorPlanData);
    const savedFloorPlan = await floorPlan.save();

    // ✅ Respond
    return SuccessHandler(
      { floorPlan: savedFloorPlan },
      201,
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
