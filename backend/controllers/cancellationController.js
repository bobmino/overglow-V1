import Booking from '../models/bookingModel.js';
import { calculateRefund, cancelBooking, processRefund } from '../utils/cancellationService.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// @desc    Calculate refund for a booking
// @route   GET /api/bookings/:id/refund-calculation
// @access  Private
const getRefundCalculation = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role !== 'Admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const refundInfo = await calculateRefund(req.params.id);
    res.json(refundInfo);
  } catch (error) {
    console.error('Get refund calculation error:', error);
    res.status(500).json({ message: 'Failed to calculate refund', error: error.message });
  }
};

// @desc    Cancel a booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBookingRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'Opérateur';
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isOperator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    const cancelledBy = isOwner ? 'user' : (isOperator ? 'operator' : 'admin');
    const result = await cancelBooking(req.params.id, reason || '', cancelledBy);

    res.json(result);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};

// @desc    Process refund for cancelled booking
// @route   POST /api/bookings/:id/process-refund
// @access  Private/Admin
const processRefundRequest = async (req, res) => {
  try {
    const { paymentMethod, paymentDetails } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    const result = await processRefund(req.params.id, paymentMethod, paymentDetails);
    res.json(result);
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Failed to process refund', error: error.message });
  }
};

export {
  getRefundCalculation,
  cancelBookingRequest,
  processRefundRequest,
};
