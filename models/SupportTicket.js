import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  messages: [ticketMessageSchema]
}, {
  timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
