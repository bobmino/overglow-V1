import Inquiry from '../models/inquiryModel.js';
import Product from '../models/productModel.js';
import Operator from '../models/operatorModel.js';
import Booking from '../models/bookingModel.js';
import { validationResult } from 'express-validator';
import {
  notifyInquiryReceived,
  notifyInquiryAnswered,
} from '../utils/notificationService.js'; // [BUG-02] Missing imports caused ReferenceError
import { sanitizeBody } from '../utils/sanitizeBody.js';
import { sanitizeText } from '../utils/sanitizer.js';
import asyncHandler from '../middleware/asyncHandler.js';

const INQUIRY_CREATE_FIELDS = ['productId', 'question', 'type'];
const INQUIRY_ANSWER_FIELDS = ['answer'];
const INQUIRY_REJECT_FIELDS = ['reason'];

// @desc    Create manual inquiry (question from client)
// @route   POST /api/inquiries
// @access  Private
const createInquiry = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // [TASK-6] Mass-assignment protection
  const { productId, question, type = 'manual' } = sanitizeBody(req.body, INQUIRY_CREATE_FIELDS);

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const operator = await Operator.findById(product.operator);
  if (!operator) {
    return res.status(404).json({ message: 'Operator not found' });
  }

  const inquiry = new Inquiry({
    product: productId,
    user: req.user._id,
    operator: product.operator,
    type,
    question: type === 'manual' ? sanitizeText(question || '') : undefined,
    status: type === 'automatic' ? 'pending' : undefined,
  });

  const createdInquiry = await inquiry.save();

  // Populate product for notification
  await createdInquiry.populate('product', 'title');

  // Notify operator of new inquiry
  await notifyInquiryReceived(createdInquiry, operator._id);

  res.status(201).json(createdInquiry);
});

// @desc    Get my inquiries (as client)
// @route   GET /api/inquiries/my-inquiries
// @access  Private
const getMyInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ user: req.user._id })
    .populate('product', 'title images city')
    .populate('operator', 'companyName')
    .sort({ createdAt: -1 });

  res.json(inquiries);
});

// @desc    Get operator inquiries (inquiries received by operator)
// @route   GET /api/inquiries/operator
// @access  Private/Operator
const getOperatorInquiries = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    return res.status(404).json({ message: 'Operator profile not found' });
  }

  const inquiries = await Inquiry.find({ operator: operator._id })
    .populate('product', 'title images city')
    .populate('user', 'name email')
    .populate('booking')
    .sort({ createdAt: -1 });

  res.json(inquiries);
});

// @desc    Answer manual inquiry
// @route   PUT /api/inquiries/:id/answer
// @access  Private/Operator
const answerInquiry = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    return res.status(404).json({ message: 'Operator profile not found' });
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ message: 'Inquiry not found' });
  }

  if (inquiry.operator.toString() !== operator._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to answer this inquiry' });
  }

  if (inquiry.type !== 'manual') {
    return res.status(400).json({ message: 'This inquiry is not a manual inquiry' });
  }

  const { answer } = sanitizeBody(req.body, INQUIRY_ANSWER_FIELDS);
  inquiry.answer = sanitizeText(answer || '');
  inquiry.answeredAt = new Date();
  const updatedInquiry = await inquiry.save();

  // Notify user that their inquiry was answered
  await notifyInquiryAnswered(updatedInquiry, inquiry.user);

  res.json(updatedInquiry);
});

// @desc    Approve automatic inquiry
// @route   PUT /api/inquiries/:id/approve
// @access  Private/Operator
const approveInquiry = asyncHandler(async (req, res) => {
  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    return res.status(404).json({ message: 'Operator profile not found' });
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ message: 'Inquiry not found' });
  }

  if (inquiry.operator.toString() !== operator._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to approve this inquiry' });
  }

  if (inquiry.type !== 'automatic') {
    return res.status(400).json({ message: 'This inquiry is not an automatic inquiry' });
  }

  inquiry.status = 'approved';
  inquiry.approvedAt = new Date();
  const updatedInquiry = await inquiry.save();

  res.json(updatedInquiry);
});

// @desc    Reject automatic inquiry
// @route   PUT /api/inquiries/:id/reject
// @access  Private/Operator
const rejectInquiry = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const operator = await Operator.findOne({ user: req.user._id });
  if (!operator) {
    return res.status(404).json({ message: 'Operator profile not found' });
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ message: 'Inquiry not found' });
  }

  if (inquiry.operator.toString() !== operator._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to reject this inquiry' });
  }

  if (inquiry.type !== 'automatic') {
    return res.status(400).json({ message: 'This inquiry is not an automatic inquiry' });
  }

  const { reason } = sanitizeBody(req.body, INQUIRY_REJECT_FIELDS);
  inquiry.status = 'rejected';
  inquiry.rejectionReason = sanitizeText(reason || '');
  const updatedInquiry = await inquiry.save();

  res.json(updatedInquiry);
});

export {
  createInquiry,
  getMyInquiries,
  getOperatorInquiries,
  answerInquiry,
  approveInquiry,
  rejectInquiry,
};

