import SupportTicket from '../models/SupportTicket.js';

// @desc    Create Support Ticket
// @route   POST /api/support
// @access  Private
export const createTicket = async (req, res, next) => {
  const { subject, message, priority } = req.body;

  try {
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message,
      priority,
      messages: [{
        senderName: req.user.name,
        senderRole: 'Customer',
        message
      }]
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user tickets
// @route   GET /api/support/mytickets
// @access  Private
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/support/admin
// @access  Private (Admin, Customer Support)
export const getAdminTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({}).populate('user', 'name email').sort({ updatedAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to Support Ticket (User or Admin)
// @route   POST /api/support/:id/messages
// @access  Private
export const replyTicket = async (req, res, next) => {
  const { message } = req.body;
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role verification
    const isCustomer = req.user.role === 'Customer';
    if (isCustomer && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    ticket.messages.push({
      senderName: req.user.name,
      senderRole: req.user.role,
      message
    });

    // Update ticket status
    if (req.user.role !== 'Customer') {
      ticket.status = 'In Progress';
    } else {
      ticket.status = 'Open';
    }

    await ticket.save();
    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Close ticket status
// @route   PUT /api/support/:id/close
// @access  Private (Admin, Support, Customer)
export const closeTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (req.user.role === 'Customer' && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ticket.status = 'Closed';
    await ticket.save();

    res.json({ success: true, message: 'Ticket closed successfully', ticket });
  } catch (error) {
    next(error);
  }
};
