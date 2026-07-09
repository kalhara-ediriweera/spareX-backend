import express from 'express';
import { processPayment, validateCoupon } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/checkout', processPayment);
router.post('/coupon', validateCoupon);

export default router;
