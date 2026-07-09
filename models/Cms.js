import mongoose from 'mongoose';

const cmsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
  timestamps: true
});

const Cms = mongoose.model('Cms', cmsSchema);
export default Cms;
