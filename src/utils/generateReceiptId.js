import Sales from '../models/Sales.js';

const generateReceiptId = async () => {
  const currentYear = new Date().getFullYear();

  // Count sales records for the current year
  const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31st of current year

  const salesCount = await Sales.countDocuments({
    createdAt: {
      $gte: startOfYear,
      $lte: endOfYear,
    },
  });

  const receiptNumber = salesCount + 1;
  const formattedNumber = String(receiptNumber).padStart(4, '0');

  // 🧾 Return Receipt ID
  return `RC-${currentYear}-${formattedNumber}`;
};

export default generateReceiptId;
