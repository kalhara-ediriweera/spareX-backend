import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { generateInvoicePdf } from '../utils/invoiceGenerator.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private / Public (Guest)
export const createOrder = async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    billingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountPrice,
    totalPrice,
    couponCode,
    pointsRedeemed,
    guestDetails
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Verify stock and update quantities
    for (const item of orderItems) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product ${item.title} not found` });
      }
      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${item.title}. Available: ${dbProduct.stock}` 
        });
      }
    }

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Process coupon use
    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode },
        { $inc: { usageCount: 1 } }
      );
    }

    let userId = null;
    // Deduct points from logged in user
    if (req.user) {
      userId = req.user._id;
      const user = await User.findById(req.user._id);
      if (pointsRedeemed && pointsRedeemed > 0) {
        user.rewardPoints = Math.max(0, user.rewardPoints - pointsRedeemed);
      }
      // Earn points on new order: 1 point for every 100 LKR spent
      const earnedPoints = Math.floor(totalPrice / 100);
      user.rewardPoints += earnedPoints;
      await user.save();
    }

    const order = new Order({
      user: userId,
      guestDetails: userId ? undefined : guestDetails,
      orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountPrice,
      totalPrice,
      couponUsed: couponCode || '',
      pointsRedeemed: pointsRedeemed || 0,
      isPaid: paymentMethod === 'COD' ? false : true, // Online payments are paid immediately in our mock
      paidAt: paymentMethod === 'COD' ? undefined : Date.now(),
      status: 'Pending',
      statusTimeline: [{
        status: 'Pending',
        note: 'Order placed successfully.',
        updatedBy: userId ? 'Customer' : 'Guest'
      }]
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private / Public (For tracking)
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If order belongs to a user, check permission (unless requester is Admin/Support)
    if (order.user && req.user && req.user.role === 'Customer' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Track Order status using order ID & email/phone (for guest or user)
// @route   GET /api/orders/track
// @access  Public
export const trackOrder = async (req, res, next) => {
  const { orderId, email } = req.query;

  try {
    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify contact email match
    let match = false;
    if (order.user && order.user.email.toLowerCase() === email.toLowerCase()) {
      match = true;
    } else if (order.guestDetails && order.guestDetails.email.toLowerCase() === email.toLowerCase()) {
      match = true;
    }

    if (!match) {
      return res.status(401).json({ success: false, message: 'Verification failed. Email does not match this order.' });
    }

    res.json({
      success: true,
      status: order.status,
      timeline: order.statusTimeline,
      orderItems: order.orderItems,
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Manager, Inventory Staff)
export const updateOrderStatus = async (req, res, next) => {
  const { status, note } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true; // COD paid on delivery
      if (!order.paidAt) order.paidAt = Date.now();
    }

    order.statusTimeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user.name + ` (${req.user.role})`
    });

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Order PDF Invoice
// @route   GET /api/orders/:id/invoice
// @access  Public / Private
export const downloadOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

    generateInvoicePdf(order, res);
  } catch (error) {
    next(error);
  }
};
