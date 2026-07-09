import express from 'express';
import {
  createTicket,
  getMyTickets,
  getAdminTickets,
  replyTicket,
  closeTicket
} from '../controllers/supportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createTicket);
router.get('/mytickets', protect, getMyTickets);
router.post('/:id/messages', protect, replyTicket);
router.put('/:id/close', protect, closeTicket);

// Admin endpoints
router.get('/admin', protect, authorize('Admin', 'Super Admin', 'Customer Support'), getAdminTickets);

export default router;
