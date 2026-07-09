import express from 'express';
import {
  getProducts,
  getSearchSuggestions,
  getVehicleFilterOptions,
  getProductBySlug,
  createProductReview,
  getCategories,
  getBrands,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// General Public routes
router.get('/', getProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/filters', getVehicleFilterOptions);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/:slug', getProductBySlug);

// Protected routes (Reviews)
router.post('/:id/reviews', protect, createProductReview);

// Admin Product CRUD routes
router.post(
  '/', 
  protect, 
  authorize('Admin', 'Super Admin', 'Inventory Staff'), 
  upload.array('images', 5), 
  createProduct
);
router.put(
  '/:id', 
  protect, 
  authorize('Admin', 'Super Admin', 'Inventory Staff'), 
  upload.array('images', 5), 
  updateProduct
);
router.delete(
  '/:id', 
  protect, 
  authorize('Admin', 'Super Admin'), 
  deleteProduct
);

export default router;
