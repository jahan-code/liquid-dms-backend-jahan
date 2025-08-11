import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
const floorPlanSchema = new mongoose.Schema({
  CompanyDetails: {
    companyName: { type: String, required: true, unique: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    phone: { type: String, required: true },
    contactPerson: { type: String, required: true },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      required: true,
    },
    dateOpened: { type: Date },
  },

  Rate: {
    apr: { type: Number, default: 0 },
    interestCalculationDays: { type: Number, default: 0 },
  },
  Fees: {
    type: {
      type: String,
      enum: ['One Time', 'Plus for each Curtailment'],
      default: 'Plus for each Curtailment',
    },
    adminFee: { type: Number, default: 0 },
    setUpFee: { type: Number, default: 0 },
    additionalFee: { type: Number, default: 0 },
  },
  term: {
    lengthInDays: { type: Number, default: 0 },
    daysUntilFirstCurtailment: { type: Number, default: 0 },
    percentPrincipalReduction: { type: Number, default: 0 },
    daysUntillSecondCurtailment: { type: Number, default: 0 },
    percentPrincipalReduction2: { type: Number, default: 0 },
    interestAndFeesWithEachCurtailment: { type: Boolean, default: false },
  },
  additionalNotes: {
    type: String,
    default: '',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Friendly duplicate key error handling for FloorPlan
floorPlanSchema.post(
  ['save', 'insertMany', 'updateOne', 'findOneAndUpdate'],
  function (error, _res, next) {
    const isDuplicate =
      error?.code === 11000 ||
      /E11000 duplicate key/i.test(String(error?.message || ''));
    if (!isDuplicate) return next(error);

    let duplicateFieldPath = '';
    let duplicateValue = '';

    if (error?.keyValue && typeof error.keyValue === 'object') {
      const [field, value] = Object.entries(error.keyValue)[0] || [];
      duplicateFieldPath = String(field || '');
      duplicateValue = String(value || '');
    } else {
      const msg = String(error?.message || '');
      const dupKeyMatch = msg.match(
        /dup key:\s*\{\s*([^:]+):\s*"?([^"}]+)"?\s*\}/i
      );
      if (dupKeyMatch) {
        duplicateFieldPath = dupKeyMatch[1]?.trim() || '';
        duplicateValue = dupKeyMatch[2]?.trim() || '';
      } else {
        const indexMatch = msg.match(/index:\s*([^\s]+)\s/i);
        if (indexMatch) {
          duplicateFieldPath = indexMatch[1]?.replace(/_1$/i, '').trim();
        }
      }
    }

    let friendlyMessage = '';
    if (
      duplicateFieldPath === 'CompanyDetails.companyName' ||
      /CompanyDetails\.companyName/i.test(duplicateFieldPath)
    ) {
      friendlyMessage = `A floor plan with the company name "${duplicateValue || 'this name'}" already exists. Please use a unique company name or select the existing floor plan.`;
    } else if (duplicateFieldPath) {
      friendlyMessage = `Duplicate value for "${duplicateFieldPath}"${duplicateValue ? `: "${duplicateValue}"` : ''}. Please use a unique value.`;
    } else {
      friendlyMessage = 'Duplicate value detected. Please use a unique value.';
    }

    return next(new ApiError(friendlyMessage, 409));
  }
);

export default mongoose.model('FloorPlan', floorPlanSchema);
