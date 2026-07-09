import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: { type: String, default: 'System' }, // Can be user email, id, or 'System'
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true }, // e.g. "CREATE_PRODUCT", "UPDATE_ORDER_STATUS"
  details: { type: String, required: true },
  ipAddress: { type: String, default: '' }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
