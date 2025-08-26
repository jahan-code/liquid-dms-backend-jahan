import Counter from '../models/counter.js';
import Vendor from '../models/vendor.js';
import Customer from '../models/customer.js';
import Sales from '../models/Sales.js';
import Vehicle from '../models/vehicle.js';

/**
 * Get next counter value for any ID type
 * @param {string} counterKey - The counter key (e.g., 'vendor:AU', 'customer', 'receipt:2025', 'stock:AU-SUV')
 * @returns {Promise<number>} - Next sequence number
 */
export const getNextCounter = async (counterKey) => {
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
};

/**
 * Generate Vendor ID with counter (enhances existing logic)
 * @param {string} category - Vendor category (e.g., 'AU', 'COM', 'IND')
 * @returns {Promise<string>} - Generated vendor ID
 */
export const generateVendorId = async (category) => {
  const counterKey = `vendor:${category}`;
  const sequence = await getNextCounter(counterKey);
  return `VEN-${category}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Generate Customer ID with counter (enhances existing logic)
 * @param {string} firstName - Customer's first name
 * @returns {Promise<string>} - Generated customer ID
 */
export const generateCustomerId = async (firstName) => {
  const counterKey = 'customer';
  const sequence = await getNextCounter(counterKey);
  const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `CUS-${cleanFirstName}-${sequence}`;
};

/**
 * Generate Receipt ID with counter (enhances existing logic)
 * @returns {Promise<string>} - Generated receipt ID
 */
export const generateReceiptId = async () => {
  const currentYear = new Date().getFullYear();
  const counterKey = `receipt:${currentYear}`;
  const sequence = await getNextCounter(counterKey);
  return `RC-${currentYear}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Generate Stock ID with counter (enhances existing logic)
 * @param {string} prefix - Stock ID prefix (e.g., 'AU-SUV', 'COM-CAR')
 * @returns {Promise<string>} - Generated stock ID
 */
export const generateStockId = async (prefix) => {
  const counterKey = `stock:${prefix}`;
  const sequence = await getNextCounter(counterKey);
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Reset counter for any ID type
 * @param {string} counterKey - The counter key to reset
 * @param {number} value - New value (default: 0)
 * @returns {Promise<Object>} - Updated counter
 */
export const resetCounter = async (counterKey, value = 0) => {
  return await Counter.findOneAndUpdate(
    { key: counterKey },
    { seq: value },
    { upsert: true, new: true }
  );
};

/**
 * Get current counter value
 * @param {string} counterKey - The counter key
 * @returns {Promise<number>} - Current sequence number
 */
export const getCurrentCounter = async (counterKey) => {
  const counter = await Counter.findOne({ key: counterKey });
  return counter ? counter.seq : 0;
};

/**
 * Get all counters
 * @returns {Promise<Array>} - Array of all counters
 */
export const getAllCounters = async () => {
  return await Counter.find().sort({ key: 1 });
};

/**
 * Get counters by type
 * @param {string} type - Counter type (e.g., 'vendor', 'customer', 'receipt', 'stock')
 * @returns {Promise<Array>} - Array of counters of specified type
 */
export const getCountersByType = async (type) => {
  const regex = new RegExp(`^${type}:`, 'i');
  return await Counter.find({ key: regex }).sort({ key: 1 });
};

/**
 * Sync counter with existing data (useful for migration)
 * @param {string} counterKey - The counter key
 * @param {string} modelName - Model name ('Vendor', 'Customer', 'Sales', 'Vehicle')
 * @param {string} idField - ID field name ('vendorId', 'customerId', 'receiptId', 'stockId')
 * @returns {Promise<Object>} - Updated counter
 */
export const syncCounterWithData = async (counterKey, modelName, idField) => {
  let Model;
  switch (modelName) {
    case 'Vendor':
      Model = Vendor;
      break;
    case 'Customer':
      Model = Customer;
      break;
    case 'Sales':
      Model = Sales;
      break;
    case 'Vehicle':
      Model = Vehicle;
      break;
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }

  // Get the highest existing ID number
  const latest = await Model.findOne()
    .select(idField)
    .sort({ [idField]: -1 })
    .lean();

  if (!latest || !latest[idField]) {
    return await resetCounter(counterKey, 0);
  }

  // Extract number from ID
  const idString = String(latest[idField]);
  const match = idString.match(/\d+$/);
  const maxNumber = match ? parseInt(match[0], 10) : 0;

  return await resetCounter(counterKey, maxNumber);
};

/**
 * Get counter statistics
 * @returns {Promise<Object>} - Counter statistics
 */
export const getCounterStats = async () => {
  const counters = await getAllCounters();

  const stats = {
    total: counters.length,
    byType: {},
    totalSequences: 0,
  };

  counters.forEach((counter) => {
    const type = counter.key.split(':')[0];
    if (!stats.byType[type]) {
      stats.byType[type] = { count: 0, totalSeq: 0 };
    }
    stats.byType[type].count++;
    stats.byType[type].totalSeq += counter.seq;
    stats.totalSequences += counter.seq;
  });

  return stats;
};

/**
 * Bulk sync all counters with existing data
 * @returns {Promise<Array>} - Results of sync operations
 */
export const bulkSyncAllCounters = async () => {
  const currentYear = new Date().getFullYear();
  const syncTasks = [
    { counterKey: 'customer', modelName: 'Customer', idField: 'customerId' },
    {
      counterKey: `receipt:${currentYear}`,
      modelName: 'Sales',
      idField: 'receiptId',
    },
    { counterKey: 'vendor:AU', modelName: 'Vendor', idField: 'vendorId' },
    { counterKey: 'vendor:COM', modelName: 'Vendor', idField: 'vendorId' },
    { counterKey: 'vendor:IND', modelName: 'Vendor', idField: 'vendorId' },
    { counterKey: 'stock:AU-SUV', modelName: 'Vehicle', idField: 'stockId' },
    { counterKey: 'stock:AU-CAR', modelName: 'Vehicle', idField: 'stockId' },
    { counterKey: 'stock:COM-SUV', modelName: 'Vehicle', idField: 'stockId' },
    { counterKey: 'stock:COM-CAR', modelName: 'Vehicle', idField: 'stockId' },
    { counterKey: 'stock:IND-SUV', modelName: 'Vehicle', idField: 'stockId' },
    { counterKey: 'stock:IND-CAR', modelName: 'Vehicle', idField: 'stockId' },
  ];

  const results = [];

  for (const task of syncTasks) {
    try {
      const result = await syncCounterWithData(
        task.counterKey,
        task.modelName,
        task.idField
      );
      results.push({
        ...task,
        success: true,
        newValue: result.seq,
      });
    } catch (error) {
      results.push({
        ...task,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};
