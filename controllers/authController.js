import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper: Generate Access and Refresh Tokens
const generateTokens = (id) => {
  const accessToken = jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'supersecretjwtkeyfor_sparex_development_2026', 
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id }, 
    process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeyfor_sparex_development_2026', 
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Helper: Set Cookies for tokens
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access Token Cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh Token Cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, phone, referralCode } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Handle Referral logic
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        // Credit reward points to referrer (e.g. 50 points)
        referrer.rewardPoints += 50;
        await referrer.save();
      }
    }

    // Generate unique referral code for this user
    const generatedReferralCode = 'SPAREX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await User.create({
      name,
      email,
      password,
      phone,
      referralCode: generatedReferralCode,
      referredBy,
      rewardPoints: referredBy ? 20 : 0 // get 20 starter points if referred
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rewardPoints: user.rewardPoints,
        referralCode: user.referralCode,
        addressBook: user.addressBook,
        savedVehicles: user.savedVehicles
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Blocked') {
        return res.status(403).json({ success: false, message: 'Your account has been blocked' });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          rewardPoints: user.rewardPoints,
          referralCode: user.referralCode,
          addressBook: user.addressBook,
          savedVehicles: user.savedVehicles
        },
        accessToken
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshTokens = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkeyfor_sparex_development_2026');
    const user = await User.findById(decoded.id);

    if (!user || user.status === 'Blocked') {
      return res.status(401).json({ success: false, message: 'Invalid user or account blocked' });
    }

    const tokens = generateTokens(user._id);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Logout User / Clear Cookies
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res, next) => {
  res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile (General)
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.file) {
        user.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const { accessToken, refreshToken } = generateTokens(updatedUser._id);
      setTokenCookies(res, accessToken, refreshToken);

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          profileImage: updatedUser.profileImage,
          rewardPoints: updatedUser.rewardPoints,
          addressBook: updatedUser.addressBook,
          savedVehicles: updatedUser.savedVehicles
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add Address
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  const { label, street, city, state, postalCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (isDefault) {
      user.addressBook.forEach(addr => addr.isDefault = false);
    }

    user.addressBook.push({ label, street, city, state, postalCode, country, isDefault });
    await user.save();
    res.json({ success: true, addressBook: user.addressBook });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Address
// @route   DELETE /api/auth/addresses/:id
// @access  Private
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.addressBook = user.addressBook.filter(addr => addr._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addressBook: user.addressBook });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Saved Vehicle
// @route   POST /api/auth/vehicles
// @access  Private
export const addVehicle = async (req, res, next) => {
  const { make, model, year, engine, transmission, fuelType } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.savedVehicles.push({ make, model, year, engine, transmission, fuelType });
    await user.save();
    res.json({ success: true, savedVehicles: user.savedVehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Saved Vehicle
// @route   DELETE /api/auth/vehicles/:id
// @access  Private
export const deleteVehicle = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.savedVehicles = user.savedVehicles.filter(veh => veh._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, savedVehicles: user.savedVehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset (Mock)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user with that email' });

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    console.log(`\n========================================\nPASSWORD RESET CODE FOR ${email}: ${resetToken}\n========================================\n`);

    res.json({ success: true, message: 'Reset token generated and printed to console (mock email send).' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password (Mock verification)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid reset token or token expired' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
