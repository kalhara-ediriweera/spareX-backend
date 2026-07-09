import mongoose from 'mongoose';

const compatibilitySchema = new mongoose.Schema({
  make: { type: String, required: true },       // e.g. Toyota
  model: { type: String, required: true },      // e.g. Vitz
  yearStart: { type: Number, required: true },  // e.g. 2012
  yearEnd: { type: Number, required: true },    // e.g. 2020
  engine: { type: String, default: 'All' },     // e.g. 1KR-FE
  transmission: { type: String, default: 'All' }, // e.g. Automatic, Manual
  fuelType: { type: String, default: 'All' }     // e.g. Petrol, Diesel, Hybrid
}, { _id: false });

const specSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  partNumber: { type: String, required: true, index: true },
  oemNumber: { type: String, default: '', index: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  condition: { type: String, enum: ['New', 'Reconditioned', 'Used'], default: 'New' },
  originCountry: { type: String, default: 'Japan' },
  warranty: { type: String, default: 'No Warranty' },
  shippingDetails: {
    weight: { type: Number, default: 0.5 }, // in kg
    dimensions: { type: String, default: 'Standard' },
    fee: { type: Number, default: 0 } // specific shipping override if any
  },
  images: [{ type: String }],
  videoUrl: { type: String, default: '' },
  threeSixtyImages: [{ type: String }], // Array of images for 360 view
  ratingAverage: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  specifications: [specSchema],
  compatibility: [compatibilitySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Full-text indexes for search suggestions
productSchema.index({
  title: 'text',
  description: 'text',
  partNumber: 'text',
  oemNumber: 'text',
  sku: 'text'
});

const Product = mongoose.model('Product', productSchema);
export default Product;
