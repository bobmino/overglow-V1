import Withdrawal from '../models/withdrawalModel.js';
import Booking from '../models/bookingModel.js';
import Operator from '../models/operatorModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { notifyWithdrawalRequest, notifyWithdrawalApproved, notifyRefundProcessed } from '../utils/notificationService.js';

// @desc    Calculate available balance for operator
// @route   GET /api/withdrawals/balance
// @access  Private/Operator
const getOperatorBalance = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    if (!operator) {
      return res.status(404).json({ message: 'Operator profile not found' });
    }

    // Get all confirmed bookings for this operator
    const bookings = await Booking.find({
      operator: operator._id,
      status: 'Confirmed',
    });

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || booking.totalAmount || 0);
    }, 0);

    // Get all withdrawals (pending + approved + processed)
    const withdrawals = await Withdrawal.find({
      operator: operator._id,
      type: 'operator_payout',
      status: { $in: ['Pending', 'Approved', 'Processed'] },
    });

    const totalWithdrawn = withdrawals.reduce((sum, withdrawal) => {
      return sum + (withdrawal.amount || 0);
    }, 0);

    const availableBalance = totalRevenue - totalWithdrawn;

    res.json({
      totalRevenue,
      totalWithdrawn,
      availableBalance: Math.max(0, availableBalance),
      pendingWithdrawals: withdrawals.filter(w => w.status === 'Pending').length,
    });
  } catch (error) {
    console.error('Get operator balance error:', error);
    res.status(500).json({ message: 'Failed to calculate balance' });
  }
};

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, type, paymentMethod, paymentDetails, reason, relatedBookings } = req.body;

    // For operator withdrawals
    if (type === 'operator_payout') {
      const operator = await Operator.findOne({ user: req.user._id });
      if (!operator) {
        return res.status(404).json({ message: 'Operator profile not found' });
      }

      // Check available balance
      const bookings = await Booking.find({
        operator: operator._id,
        status: 'Confirmed',
      });
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || b.totalAmount || 0), 0);
      const withdrawals = await Withdrawal.find({
        operator: operator._id,
        type: 'operator_payout',
        status: { $in: ['Pending', 'Approved', 'Processed'] },
      });
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      const availableBalance = Math.max(0, totalRevenue - totalWithdrawn);

      if (amount > availableBalance) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const withdrawal = new Withdrawal({
        user: req.user._id,
        operator: operator._id,
        type: 'operator_payout',
        amount,
        currency: 'EUR',
        status: 'Pending',
        paymentMethod,
        paymentDetails,
      });

      const createdWithdrawal = await withdrawal.save();

      // Notify admin
      const admins = await User.find({ role: 'Admin' });
      const adminIds = admins.map(admin => admin._id);
      await notifyWithdrawalRequest(createdWithdrawal, adminIds);

      res.status(201).json(createdWithdrawal);
    } else if (type === 'client_refund') {
      // For client refunds (from cancelled bookings)
      const withdrawal = new Withdrawal({
        user: req.user._id,
        type: 'client_refund',
        amount,
        currency: 'EUR',
        status: 'Pending',
        paymentMethod,
        paymentDetails,
        reason,
        relatedBookings: relatedBookings || [],
      });

      const createdWithdrawal = await withdrawal.save();

      // Notify admin
      const admins = await User.find({ role: 'Admin' });
      const adminIds = admins.map(admin => admin._id);
      await notifyWithdrawalRequest(createdWithdrawal, adminIds);

      res.status(201).json(createdWithdrawal);
    } else {
      res.status(400).json({ message: 'Invalid withdrawal type' });
    }
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Failed to create withdrawal request' });
  }
};

// @desc    Get my withdrawals
// @route   GET /api/withdrawals/my-withdrawals
// @access  Private
const getMyWithdrawals = async (req, res) => {
  try {
    const operator = await Operator.findOne({ user: req.user._id });
    const query = operator 
      ? { $or: [{ user: req.user._id }, { operator: operator._id }] }
      : { user: req.user._id };

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .populate('operator', 'companyName')
      .populate('relatedBookings', 'schedule');

    res.json(withdrawals);
  } catch (error) {
    console.error('Get my withdrawals error:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
};

// @desc    Get all withdrawals (admin)
// @route   GET /api/withdrawals
// @access  Private/Admin
const getAllWithdrawals = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name email')
      .populate('operator', 'companyName')
      .populate('relatedBookings', 'schedule')
      .sort({ createdAt: -1 });

    res.json(withdrawals);
  } catch (error) {
    console.error('Get all withdrawals error:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawals' });
  }
};

// @desc    Approve withdrawal
// @route   PUT /api/withdrawals/:id/approve
// @access  Private/Admin
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('user')
      .populate('operator');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'Pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'Approved';
    await withdrawal.save();

    // Notify user
    await notifyWithdrawalApproved(withdrawal, withdrawal.user._id);

    res.json(withdrawal);
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Failed to approve withdrawal' });
  }
};

// @desc    Reject withdrawal
// @route   PUT /api/withdrawals/:id/reject
// @access  Private/Admin
const rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'Pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'Rejected';
    withdrawal.rejectionReason = reason || '';
    await withdrawal.save();

    res.json(withdrawal);
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Failed to reject withdrawal' });
  }
};

// @desc    Process withdrawal (mark as processed after payment)
// @route   PUT /api/withdrawals/:id/process
// @access  Private/Admin
const processWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('user');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'Approved') {
      return res.status(400).json({ message: 'Withdrawal must be approved first' });
    }

    withdrawal.status = 'Processed';
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    // Notify user (especially for refunds)
    if (withdrawal.type === 'client_refund') {
      await notifyRefundProcessed(withdrawal, withdrawal.user._id);
    } else {
      await notifyWithdrawalApproved(withdrawal, withdrawal.user._id);
    }

    res.json(withdrawal);
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
};

export {
  getOperatorBalance,
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  processWithdrawal,
};

