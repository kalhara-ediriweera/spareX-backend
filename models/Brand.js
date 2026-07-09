import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' }
}, {
  timestamps: true
});

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
