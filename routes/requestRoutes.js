import express from 'express';
import {
  submitPartRequest,
  getMyRequests,
  getAdminRequests,
  updatePartRequest
} from '../controllers/requestController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public/Private submit
router.post('/', (req, res, next) => {
  if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
    return protect(req, res, next);
  }
  next();
}, upload.single('partImage'), submitPartRequest);

// Customer view my list
router.get('/myrequests', protect, getMyRequests);

// Admin view and updates
router.get('/admin', protect, authorize('Admin', 'Super Admin', 'Manager', 'Customer Support'), getAdminRequests);
router.put('/:id', protect, authorize('Admin', 'Super Admin', 'Manager', 'Customer Support'), updatePartRequest);

export default router;
