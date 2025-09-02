import FloorPlan from '../models/floorPlan.js';
import Vehicle from '../models/vehicle.js';
import Sales from '../models/Sales.js';
import Accounting from '../models/Accounting.js';
import logger from '../functions/logger.js';

/**
 * Check and update floor plan status automatically
 * @param {string} receiptNumber - Receipt number to check
 */
export const checkFloorPlanStatus = async (receiptNumber) => {
  try {
    // Find the sales record
    const sales = await Sales.findOne({ receiptId: receiptNumber });
    if (!sales || !sales.vehicleInfo) return;

    // Find the vehicle and its floor plan
    const vehicle = await Vehicle.findById(sales.vehicleInfo);
    if (!vehicle || !vehicle.floorPlanDetails?.floorPlan) return;

    const floorPlanId = vehicle.floorPlanDetails.floorPlan;

    // Find all vehicles using this floor plan
    const vehicles = await Vehicle.find({
      'floorPlanDetails.floorPlan': floorPlanId,
      'floorPlanDetails.isFloorPlanned': true,
    });

    // If no vehicles, set floor plan to inactive
    if (vehicles.length === 0) {
      await FloorPlan.findByIdAndUpdate(floorPlanId, {
        'CompanyDetails.status': 'Inactive',
      });
      return;
    }

    // OPTIMIZATION: Only check if this might be the last installment
    // Get current vehicle's installment info
    const currentVehicleSales = await Sales.findOne({
      vehicleInfo: vehicle._id,
    });
    if (currentVehicleSales) {
      const totalInstallments =
        currentVehicleSales.pricing?.paymentSchedule?.numberOfPayments || 0;
      const paidInstallments = await Accounting.countDocuments({
        'AccountingDetails.receiptNumber': currentVehicleSales.receiptId,
      });

      // Only do full check if this vehicle just completed its installments
      if (paidInstallments >= totalInstallments) {
        // Check if all vehicles have completed installments
        let allComplete = true;
        for (const v of vehicles) {
          const vehicleSales = await Sales.findOne({ vehicleInfo: v._id });
          if (vehicleSales) {
            const vTotalInstallments =
              vehicleSales.pricing?.paymentSchedule?.numberOfPayments || 0;
            const vPaidInstallments = await Accounting.countDocuments({
              'AccountingDetails.receiptNumber': vehicleSales.receiptId,
            });
            // Treat zero scheduled payments as still active (not complete)
            if (
              vTotalInstallments === 0 ||
              vPaidInstallments < vTotalInstallments
            ) {
              allComplete = false;
              break;
            }
          }
        }

        // If all vehicles have completed installments, set floor plan to inactive
        if (allComplete) {
          await FloorPlan.findByIdAndUpdate(floorPlanId, {
            'CompanyDetails.status': 'Inactive',
          });
          logger.info(
            `Floor plan ${floorPlanId} set to Inactive - all installments completed`
          );
        }
      }
    }
  } catch (error) {
    logger.error('Error checking floor plan status:', error);
  }
};

/**
 * Check and update floor plan status by floor plan ID
 * @param {string} floorPlanId - Floor plan ID to check
 */
export const checkFloorPlanStatusById = async (floorPlanId) => {
  try {
    // Find all vehicles using this floor plan
    const vehicles = await Vehicle.find({
      'floorPlanDetails.floorPlan': floorPlanId,
      'floorPlanDetails.isFloorPlanned': true,
    });

    // If no vehicles, set floor plan to inactive
    if (vehicles.length === 0) {
      await FloorPlan.findByIdAndUpdate(floorPlanId, {
        'CompanyDetails.status': 'Inactive',
      });

      return;
    }

    // Check if all vehicles have completed installments
    let allComplete = true;
    for (const vehicle of vehicles) {
      const vehicleSales = await Sales.findOne({ vehicleInfo: vehicle._id });
      if (vehicleSales) {
        const totalInstallments =
          vehicleSales.pricing?.paymentSchedule?.numberOfPayments || 0;
        const paidInstallments = await Accounting.countDocuments({
          'AccountingDetails.receiptNumber': vehicleSales.receiptId,
        });

        // Treat zero scheduled payments as still active (not complete)
        if (totalInstallments === 0 || paidInstallments < totalInstallments) {
          allComplete = false;
          break;
        }
      } else {
        // No sales yet for this vehicle → not complete, keep floor plan Active

        allComplete = false;
        break;
      }
    }

    // Update floor plan status based on completion (skip soft-deleted)
    const floorPlan = await FloorPlan.findById(floorPlanId);
    if (floorPlan) {
      if (floorPlan.isDeleted) {
        // Never reactivate soft-deleted floor plans
        return;
      }
      if (allComplete && floorPlan.CompanyDetails.status === 'Active') {
        await FloorPlan.findByIdAndUpdate(floorPlanId, {
          'CompanyDetails.status': 'Inactive',
        });
      } else if (
        !allComplete &&
        floorPlan.CompanyDetails.status === 'Inactive'
      ) {
        await FloorPlan.findByIdAndUpdate(floorPlanId, {
          'CompanyDetails.status': 'Active',
        });
      }
    }
  } catch (error) {
    logger.error('Error checking floor plan status by ID:', error);
  }
};

/**
 * Check floor plan status when vehicle is assigned/removed
 * @param {string} vehicleId - Vehicle ID that was updated
 */
export const checkFloorPlanStatusForVehicle = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return;

    // If vehicle has a floor plan, check that floor plan's status
    if (vehicle.floorPlanDetails?.floorPlan) {
      await checkFloorPlanStatusById(vehicle.floorPlanDetails.floorPlan);
    }

    // Also check any floor plan that might have lost this vehicle
    // This handles cases where vehicle was moved from one floor plan to another
    const allFloorPlans = await FloorPlan.find({
      'CompanyDetails.status': 'Active',
      isDeleted: false,
    });

    for (const floorPlan of allFloorPlans) {
      const vehiclesUsingThisPlan = await Vehicle.find({
        'floorPlanDetails.floorPlan': floorPlan._id,
        'floorPlanDetails.isFloorPlanned': true,
      });

      if (vehiclesUsingThisPlan.length === 0) {
        await FloorPlan.findByIdAndUpdate(floorPlan._id, {
          'CompanyDetails.status': 'Inactive',
        });
        logger.info(
          `Floor plan ${floorPlan.CompanyDetails.companyName} set to Inactive - no vehicles assigned`
        );
      }
    }
  } catch (error) {
    logger.error('Error checking floor plan status for vehicle:', error);
  }
};
