import express from 'express';
import { getCmsSettings, updateCmsSettings } from '../controllers/cmsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:key', getCmsSettings);
router.put('/:key', protect, authorize('Admin', 'Super Admin', 'Manager'), updateCmsSettings);

export default router;
