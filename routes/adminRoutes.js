import express from 'express';
import {
  getAnalytics,
  bulkUploadProducts,
  exportProductsCSV,
  getCustomersList,
  toggleCustomerStatus,
  adjustRewardPoints,
  getAuditLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/analytics', protect, authorize('Admin', 'Super Admin', 'Manager'), getAnalytics);
router.post('/products/bulk-upload', protect, authorize('Admin', 'Super Admin', 'Inventory Staff'), upload.single('csvFile'), bulkUploadProducts);
router.get('/products/export', protect, authorize('Admin', 'Super Admin', 'Manager', 'Inventory Staff'), exportProductsCSV);
router.get('/customers', protect, authorize('Admin', 'Super Admin', 'Manager'), getCustomersList);
router.put('/customers/:id/status', protect, authorize('Admin', 'Super Admin'), toggleCustomerStatus);
router.put('/customers/:id/rewards', protect, authorize('Admin', 'Super Admin', 'Manager'), adjustRewardPoints);
router.get('/logs', protect, authorize('Admin', 'Super Admin'), getAuditLogs);

export default router;
