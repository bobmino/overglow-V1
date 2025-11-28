import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  type: {
    type: String,
    enum: [
      'booking_created',
      'booking_confirmed',
      'booking_cancelled',
      'product_pending',
      'product_approved',
      'product_rejected',
      'review_pending',
      'review_approved',
      'review_rejected',
      'inquiry_received',
      'inquiry_answered',
      'inquiry_approved',
      'inquiry_rejected',
      'approval_request',
      'withdrawal_requested',
      'withdrawal_approved',
      'withdrawal_rejected',
      'refund_processed',
      'operator_registered',
      'operator_approved',
      'operator_suspended',
      'onboarding_submitted',
      'onboarding_approved',
      'onboarding_rejected',
      'payment_received',
      'activity_reminder',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['Product', 'Booking', 'Review', 'Inquiry', 'Withdrawal', 'Operator', 'OperatorOnboarding'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

