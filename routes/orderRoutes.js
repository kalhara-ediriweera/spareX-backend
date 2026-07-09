import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  trackOrder,
  updateOrderStatus,
  downloadOrderInvoice
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes for checkout and tracking
router.post('/', (req, res, next) => {
  // If headers contain Authorization, use protect, else proceed as guest
  if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
    return protect(req, res, next);
  }
  next();
}, createOrder);

router.get('/track', trackOrder);
router.get('/:id/invoice', downloadOrderInvoice);

// Logged in user routes
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin status update
router.put('/:id/status', protect, authorize('Admin', 'Super Admin', 'Manager', 'Inventory Staff'), updateOrderStatus);

export default router;
