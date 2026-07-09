import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Office, Work
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true }, // Province or District in Sri Lanka
  postalCode: { type: String, required: true },
  country: { type: String, default: 'Sri Lanka' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const savedVehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },      // e.g. Toyota
  model: { type: String, required: true },     // e.g. Vitz
  year: { type: Number, required: true },      // e.g. 2018
  engine: { type: String },                    // e.g. 1KR-FE
  transmission: { type: String },              // e.g. Automatic
  fuelType: { type: String }                   // e.g. Petrol
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Super Admin', 'Admin', 'Manager', 'Inventory Staff', 'Customer Support', 'Customer'], 
    default: 'Customer' 
  },
  profileImage: { type: String, default: '' },
  phone: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  addressBook: [addressSchema],
  savedVehicles: [savedVehicleSchema],
  rewardPoints: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Blocked'], default: 'Active' }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
