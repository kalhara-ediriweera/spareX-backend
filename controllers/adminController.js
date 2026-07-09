import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import AuditLog from '../models/AuditLog.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import { Parser } from 'json2csv';

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin, Manager)
export const getAnalytics = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalOrders = await Order.countDocuments();

    // Aggregate Sales Revenue
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueData[0] ? revenueData[0].totalRevenue : 0;

    // Aggregate Sales by Status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Aggregate Sales over last 7 days (Daily Sales chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const match = dailySales.find(item => item._id === dateString);
      chartData.push({
        date: dateString,
        sales: match ? match.sales : 0,
        orders: match ? match.count : 0
      });
    }

    // Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    // Category distribution
    const categorySales = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const populatedCategorySales = await Category.populate(categorySales, { path: '_id', select: 'name' });
    const categoryChartData = populatedCategorySales.map(item => ({
      name: item._id ? item._id.name : 'Unknown',
      value: item.count
    }));

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue
      },
      ordersByStatus,
      dailySales: chartData,
      categoryShare: categoryChartData,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Upload Products via CSV File
// @route   POST /api/admin/products/bulk-upload
// @access  Private (Admin, Manager, Inventory Staff)
export const bulkUploadProducts = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
  }

  const filePath = req.file.path;
  const productsToInsert = [];

  try {
    // Read category and brands to map titles to DB object IDs
    const categories = await Category.find({});
    const brands = await Brand.find({});

    const getCatId = (name) => {
      const cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
      return cat ? cat._id : categories[0]._id; // fallback
    };

    const getBrandId = (name) => {
      const br = brands.find(b => b.name.toLowerCase() === name.toLowerCase());
      return br ? br._id : brands[0]._id; // fallback
    };

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Expected CSV columns: title, description, sku, partNumber, oemNumber, price, stock, brand, category, condition
        productsToInsert.push({
          title: row.title,
          description: row.description || 'Premium genuine vehicle spare part.',
          slug: (row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() + Math.random().toString(36).substring(2, 6)),
          sku: row.sku || 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          partNumber: row.partNumber,
          oemNumber: row.oemNumber || '',
          price: Number(row.price) || 1000,
          stock: Number(row.stock) || 5,
          brand: getBrandId(row.brand),
          category: getCatId(row.category),
          condition: row.condition || 'New',
          images: row.images ? row.images.split(',') : ['/uploads/products/default.jpg']
        });
      })
      .on('end', async () => {
        await Product.insertMany(productsToInsert);
        // Clean up file
        fs.unlinkSync(filePath);

        // Audit Log
        await AuditLog.create({
          user: req.user.email,
          userId: req.user._id,
          action: 'BULK_UPLOAD_PRODUCTS',
          details: `Uploaded ${productsToInsert.length} products via CSV`
        });

        res.json({
          success: true,
          message: `Successfully uploaded ${productsToInsert.length} products.`
        });
      });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    next(error);
  }
};

// @desc    Export Products to CSV File
// @route   GET /api/admin/products/export
// @access  Private (Admin, Manager, Inventory Staff)
export const exportProductsCSV = async (req, res, next) => {
  try {
    const products = await Product.find({}).populate('brand', 'name').populate('category', 'name');

    const fields = [
      { label: 'Title', value: 'title' },
      { label: 'SKU', value: 'sku' },
      { label: 'Part Number', value: 'partNumber' },
      { label: 'OEM Number', value: 'oemNumber' },
      { label: 'Price', value: 'price' },
      { label: 'Stock', value: 'stock' },
      { label: 'Brand', value: 'brand.name' },
      { label: 'Category', value: 'category.name' },
      { label: 'Condition', value: 'condition' }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(products);

    res.header('Content-Type', 'text/csv');
    res.attachment('sparex_products_export.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customers List
// @route   GET /api/admin/customers
// @access  Private (Admin, Manager)
export const getCustomersList = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, customers: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Active/Blocked)
// @route   PUT /api/admin/customers/:id/status
// @access  Private (Admin)
export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = user.status === 'Active' ? 'Blocked' : 'Active';
    await user.save();

    // Audit Log
    await AuditLog.create({
      user: req.user.email,
      userId: req.user._id,
      action: 'TOGGLE_USER_STATUS',
      details: `Changed status of ${user.email} to ${user.status}`
    });

    res.json({ success: true, message: `User account is now ${user.status}`, customer: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually Adjust Customer Reward Points
// @route   PUT /api/admin/customers/:id/rewards
// @access  Private (Admin, Manager)
export const adjustRewardPoints = async (req, res, next) => {
  const { points } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.rewardPoints = Number(points);
    await user.save();

    res.json({ success: true, message: 'Reward points updated', customer: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Audit / Activity logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
