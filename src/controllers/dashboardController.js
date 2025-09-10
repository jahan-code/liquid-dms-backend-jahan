import Sales from '../models/Sales.js';
import Vehicle from '../models/vehicle.js';
import Accounting from '../models/Accounting.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import ApiError from '../utils/ApiError.js';
import Customer from '../models/customer.js';
import mongoose from 'mongoose';

export const getDashboardSummary = async (req, res, next) => {
	try {
		// Resolve tenant ObjectId for strict aggregation matching
		const userIdStr = req.user?.userId;
		if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
			return next(new ApiError('Invalid or missing user context', 401));
		}
		const tenantId = new mongoose.Types.ObjectId(userIdStr);

		// Total vehicles (excluding soft-deleted)
		const totalVehicles = await Vehicle.countDocuments({ isDeleted: false, createdBy: tenantId });

		// Total sales: sum of totalAmount on all sales
		const salesAgg = await Sales.aggregate([
			{ $match: { createdBy: tenantId } },
			{ $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
		]);
		const totalSales = salesAgg[0]?.total || 0;

		// Payment collected: sum of Accounting.billDetails.amount
		const paymentsAgg = await Accounting.aggregate([
			{ $match: { createdBy: tenantId } },
			{ $group: { _id: null, total: { $sum: { $ifNull: ['$billDetails.amount', 0] } } } },
		]);
		const totalPayments = paymentsAgg[0]?.total || 0;

		// Vendor payments: sum of Vehicle.totalcost (exclude soft-deleted)
		const vendorAgg = await Vehicle.aggregate([
			{ $match: { isDeleted: { $ne: true }, createdBy: tenantId } },
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
		const activeCustomerIds = await Sales.distinct('customerInfo', { customerInfo: { $ne: null }, createdBy: tenantId });
		const activeCustomers = Array.isArray(activeCustomerIds) ? activeCustomerIds.length : 0;
		const totalCustomers = await Customer.countDocuments({ createdBy: tenantId });
		const inactiveCustomers = Math.max(0, totalCustomers - activeCustomers);

		// Inline: Sales time-series for charts
		const now = new Date();
		const startOfToday = new Date(now);
		startOfToday.setHours(0, 0, 0, 0);

		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - 6);
		startOfWeek.setHours(0, 0, 0, 0);

		const startOf30 = new Date(now);
		startOf30.setDate(now.getDate() - 29);
		startOf30.setHours(0, 0, 0, 0);

		const startOfSixMonths = new Date(now);
		startOfSixMonths.setMonth(now.getMonth() - 5, 1);
		startOfSixMonths.setHours(0, 0, 0, 0);

		const startOfYear = new Date(now.getFullYear(), 0, 1);

		const sumExpr = { $sum: { $ifNull: ['$totalAmount', 0] } };

		const [seriesToday, seriesLastWeek, seriesLast30Days, seriesLastSixMonths, seriesThisYear] = await Promise.all([
			Sales.aggregate([
				{ $match: { createdAt: { $gte: startOfToday }, createdBy: tenantId } },
				{ $group: { _id: { $dateToString: { format: '%H:00', date: '$createdAt' } }, total: sumExpr } },
				{ $sort: { _id: 1 } },
			]),
			Sales.aggregate([
				{ $match: { createdAt: { $gte: startOfWeek }, createdBy: tenantId } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: sumExpr } },
				{ $sort: { _id: 1 } },
			]),
			Sales.aggregate([
				{ $match: { createdAt: { $gte: startOf30 }, createdBy: tenantId } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: sumExpr } },
				{ $sort: { _id: 1 } },
			]),
			Sales.aggregate([
				{ $match: { createdAt: { $gte: startOfSixMonths }, createdBy: tenantId } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: sumExpr } },
				{ $sort: { _id: 1 } },
			]),
			Sales.aggregate([
				{ $match: { createdAt: { $gte: startOfYear }, createdBy: tenantId } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: sumExpr } },
				{ $sort: { _id: 1 } },
			]),
		]);

		const mapSeries = (arr) => arr.map((d) => ({ label: d._id, total: d.total }));

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
				salesSeries: {
					today: mapSeries(seriesToday),
					lastWeek: mapSeries(seriesLastWeek),
					last30Days: mapSeries(seriesLast30Days),
					lastSixMonths: mapSeries(seriesLastSixMonths),
					thisYear: mapSeries(seriesThisYear),
				},
			},
			200,
			'Dashboard summary fetched successfully',
			res
		);
	} catch (error) {
		next(new ApiError(error.message || 'Failed to fetch dashboard summary', 500));
	}
};
