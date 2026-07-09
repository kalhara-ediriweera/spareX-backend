import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
  getUserProfile,
  updateUserProfile,
  addAddress,
  deleteAddress,
  addVehicle,
  deleteVehicle,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshTokens);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

router.post('/vehicles', protect, addVehicle);
router.delete('/vehicles/:id', protect, deleteVehicle);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
