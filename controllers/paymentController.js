// @desc    Initiate payment checkout session
// @route   POST /api/payments/checkout
// @access  Public / Private
export const processPayment = async (req, res, next) => {
  const { paymentMethod, amount, orderId } = req.body;

  try {
    // Generate a payment simulation link or simulate immediate success
    let transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    if (paymentMethod === 'Stripe' || paymentMethod === 'PayPal' || paymentMethod === 'PayHere') {
      // Return details for client checkout screen
      return res.json({
        success: true,
        message: `${paymentMethod} payment gateway mock session initiated`,
        transactionId,
        paymentUrl: `/checkout-success?orderId=${orderId}&txnId=${transactionId}&gateway=${paymentMethod}`
      });
    }

    res.json({
      success: true,
      message: 'Cash on delivery order, payment pending delivery.',
      transactionId: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon validation
// @route   POST /api/payments/coupon
// @access  Public
import Coupon from '../models/Coupon.js';

export const validateCoupon = async (req, res, next) => {
  const { code, cartTotal } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon code usage limit reached' });
    }

    if (cartTotal < coupon.minPurchase) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum purchase of LKR ${coupon.minPurchase} required for this coupon` 
      });
    }

    res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount
    });
  } catch (error) {
    next(error);
  }
};
