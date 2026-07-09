import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  partNumber: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // price at purchase
  image: { type: String, default: '' }
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  updatedBy: { type: String, default: 'System' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for Guest Checkout
  guestDetails: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true }, // District
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Sri Lanka' }
  },
  billingAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },
  paymentMethod: { 
    type: String, 
    enum: ['COD', 'Stripe', 'PayHere', 'PayPal'], 
    required: true 
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    email: { type: String }
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  discountPrice: { type: Number, required: true, default: 0.0 }, // discount from coupon/rewards
  totalPrice: { type: Number, required: true, default: 0.0 },
  couponUsed: { type: String, default: '' },
  pointsRedeemed: { type: Number, default: 0 },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], 
    default: 'Pending' 
  },
  statusTimeline: [timelineEventSchema]
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
