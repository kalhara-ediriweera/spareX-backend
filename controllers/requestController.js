import PartRequest from '../models/PartRequest.js';

// @desc    Submit new custom spare part request
// @route   POST /api/requests
// @access  Public / Private (Logged in user linked automatically)
export const submitPartRequest = async (req, res, next) => {
  const {
    name,
    email,
    phone,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    chassisNumber,
    partName,
    partDescription
  } = req.body;

  try {
    let partImage = '';
    if (req.file) {
      partImage = `/uploads/requests/${req.file.filename}`;
    }

    const newRequest = await PartRequest.create({
      user: req.user ? req.user._id : null,
      name,
      email,
      phone,
      vehicleMake,
      vehicleModel,
      vehicleYear: Number(vehicleYear),
      chassisNumber,
      partName,
      partDescription,
      partImage
    });

    res.status(201).json({
      success: true,
      message: 'Part request submitted successfully. Our team will review and reply shortly.',
      request: newRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's own part requests
// @route   GET /api/requests/myrequests
// @access  Private
export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await PartRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all part requests (Admin)
// @route   GET /api/requests/admin
// @access  Private (Admin, Manager, Customer Support)
export const getAdminRequests = async (req, res, next) => {
  try {
    const requests = await PartRequest.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin updates a part request (reviews, issues quote)
// @route   PUT /api/requests/:id
// @access  Private (Admin, Manager, Customer Support)
export const updatePartRequest = async (req, res, next) => {
  const { status, quotePrice, replyMessage, adminNotes } = req.body;
  try {
    const request = await PartRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Part request not found' });
    }

    request.status = status || request.status;
    if (quotePrice !== undefined) request.quotePrice = Number(quotePrice);
    if (replyMessage !== undefined) request.replyMessage = replyMessage;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;

    await request.save();

    res.json({
      success: true,
      message: 'Part request updated successfully',
      request
    });
  } catch (error) {
    next(error);
  }
};
