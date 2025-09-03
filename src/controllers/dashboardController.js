import Sales from '../models/Sales.js';
import Vehicle from '../models/vehicle.js';
import Accounting from '../models/Accounting.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import ApiError from '../utils/ApiError.js';
import Customer from '../models/customer.js';

export const getDashboardSummary = async (req, res, next) => {
	try {
		// Total vehicles (excluding soft-deleted)
		const totalVehicles = await Vehicle.countDocuments({ isDeleted: false });

		// Total sales: sum of totalAmount on all sales
		const salesAgg = await Sales.aggregate([
			{ $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
		]);
		const totalSales = salesAgg[0]?.total || 0;

		// Payment collected: sum of Accounting.billDetails.amount
		const paymentsAgg = await Accounting.aggregate([
			{ $group: { _id: null, total: { $sum: { $ifNull: ['$billDetails.amount', 0] } } } },
		]);
		const totalPayments = paymentsAgg[0]?.total || 0;

		// Vendor payments: sum of Vehicle.totalcost (exclude soft-deleted)
		const vendorAgg = await Vehicle.aggregate([
			{ $match: { isDeleted: { $ne: true } } },
			{ $group: { _id: null, total: { $sum: { $ifNull: ['$totalcost', 0] } } } },
		]);
		const vendorPayments = vendorAgg[0]?.total || 0;

		// Outstanding balance: totalSales - totalPayments
		const outstandingBalance = Math.max(0, Number(totalSales) - Number(totalPayments));

		// Gross profit: totalSales - vendorPayments
		const grossProfit = Number(totalSales) - Number(vendorPayments);

		// Profit margin (%): (grossProfit / totalSales) * 100 (safe if totalSales=0)
		const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

		// Active/Inactive customers
		const activeCustomerIds = await Sales.distinct('customerInfo', { customerInfo: { $ne: null } });
		const activeCustomers = Array.isArray(activeCustomerIds) ? activeCustomerIds.length : 0;
		const totalCustomers = await Customer.countDocuments();
		const inactiveCustomers = Math.max(0, totalCustomers - activeCustomers);

		return SuccessHandler(
			{
				totalVehicles,
				totalSales,
				totalPayments,
				vendorPayments,
				outstandingBalance,
				grossProfit,
				profitMargin,
				activeCustomers,
				inactiveCustomers,
			},
			200,
			'Dashboard summary fetched successfully',
			res
		);
	} catch (error) {
		next(new ApiError(error.message || 'Failed to fetch dashboard summary', 500));
	}
};
