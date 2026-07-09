import mongoose from 'mongoose';

const partRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleMake: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  vehicleYear: { type: Number, required: true },
  chassisNumber: { type: String, required: true }, // Chassis/VIN is vital for precise spare parts lookup
  partName: { type: String, required: true },
  partDescription: { type: String, default: '' },
  partImage: { type: String, default: '' }, // Path/URL to uploaded image
  status: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Quoted', 'Closed'], 
    default: 'Pending' 
  },
  quotePrice: { type: Number, default: 0 }, // Admin sets this price quote
  replyMessage: { type: String, default: '' }, // Admin reply
  adminNotes: { type: String, default: '' }
}, {
  timestamps: true
});

const PartRequest = mongoose.model('PartRequest', partRequestSchema);
export default PartRequest;
