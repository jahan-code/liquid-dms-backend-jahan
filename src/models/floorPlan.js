import mongoose from 'mongoose';
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

export default mongoose.model('FloorPlan', floorPlanSchema);
