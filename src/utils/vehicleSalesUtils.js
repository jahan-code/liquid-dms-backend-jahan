import Vehicle from '../models/vehicle.js';
import Sales from '../models/Sales.js';

/**
 * Get vehicle details by sales ID
 * @param {string} salesId - The sales record ID
 * @returns {Promise<Object|null>} - Vehicle document or null
 */
export const getVehicleBySalesId = async (salesId) => {
  try {
    const vehicle = await Vehicle.findOne({ salesId: salesId });
    return vehicle;
  } catch (error) {
    throw new Error(`Failed to get vehicle by sales ID: ${error.message}`);
  }
};

/**
 * Get sales details by vehicle ID
 * @param {string} vehicleId - The vehicle ID
 * @returns {Promise<Object|null>} - Sales document or null
 */
export const getSalesByVehicleId = async (vehicleId) => {
  try {
    const sales = await Sales.findOne({ vehicleInfo: vehicleId });
    return sales;
  } catch (error) {
    throw new Error(`Failed to get sales by vehicle ID: ${error.message}`);
  }
};

/**
 * Get all vehicles that are sold (have a salesId)
 * @returns {Promise<Array>} - Array of sold vehicles
 */
export const getSoldVehicles = async () => {
  try {
    const soldVehicles = await Vehicle.find({
      salesId: { $ne: null },
      salesStatus: 'Sold',
    }).populate('salesId');
    return soldVehicles;
  } catch (error) {
    throw new Error(`Failed to get sold vehicles: ${error.message}`);
  }
};

/**
 * Get all available vehicles (no salesId)
 * @returns {Promise<Array>} - Array of available vehicles
 */
export const getAvailableVehicles = async () => {
  try {
    const availableVehicles = await Vehicle.find({
      salesId: null,
      salesStatus: 'Available',
    });
    return availableVehicles;
  } catch (error) {
    throw new Error(`Failed to get available vehicles: ${error.message}`);
  }
};
