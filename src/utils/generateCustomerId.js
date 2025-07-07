import Customer from '../models/customer.js';

const generateCustomerId = async (firstName) => {
  const customerCount = await Customer.countDocuments();

  const idSuffix = 1001 + customerCount;

  const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // 🆔 Return ID
  return `CUS-${cleanFirstName}-${idSuffix}`;
};

export default generateCustomerId;
