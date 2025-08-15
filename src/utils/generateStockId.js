import Counter from '../models/counter.js';
import Vehicle from '../models/vehicle.js';

// prefix example: "AU-SUV"
export const getNextStockIdForPrefix = async (prefix) => {
  // Step 1: ensure counter exists and increment optimistically
  const incDoc = await Counter.findOneAndUpdate(
    { key: `stock:${prefix}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Step 2: find current max existing suffix among vehicles for this prefix
  const regex = new RegExp(`^${prefix}-\\d{4}$`, 'i');
  const latest = await Vehicle.findOne({ stockId: regex })
    .select('stockId')
    .sort({ stockId: -1 })
    .lean();

  let maxExisting = 0;
  if (latest?.stockId) {
    const parts = String(latest.stockId).split('-');
    const suffix = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(suffix)) maxExisting = suffix;
  }

  const targetSeq = Math.max(incDoc.seq, maxExisting + 1);

  // Step 3: bump seq forward if needed atomically
  const finalDoc = await Counter.findOneAndUpdate(
    { key: `stock:${prefix}` },
    { $max: { seq: targetSeq } },
    { new: true }
  );

  const next = finalDoc.seq;
  return `${prefix}-${String(next).padStart(4, '0')}`;
};

export default getNextStockIdForPrefix;
