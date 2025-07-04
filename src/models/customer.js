import mongoose from 'mongoose';
const CustomerSchema = new mongoose.Schema({
  CustomerInformation: {
    firstName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    Street: {
      type: String,
    },
    City: {
      type: String,
    },
    State: {
      type: String,
    },
    ZipCode: {
      type: String,
    },
    Country: {
      type: String,
    },
    primaryContactNumber: {
      type: String,
    },
    SecondaryContactNumber: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    DateOfBirth: {
      type: Date,
    },
    Gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    SSN: {
      type: String,
    },
    DriverLicense: {
      type: String,
    },
    LicenseExpiration: {
      type: Date,
    },
    SpouseName: {
      type: String,
    },
    vehicleUse: {
      type: String,
    },
    isHomeOwner: {
      type: Boolean,
      default: false,
    },
    hearAboutUs: {
      type: String,
      enum: ['Facebook', 'Twitter', 'Other'],
    },
  },
});

export default mongoose.model('Customer', CustomerSchema);
