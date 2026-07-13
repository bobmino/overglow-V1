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
      'new_review',
      'low_rating',
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
      'badge_request_submitted',
      'badge_request_approved',
      'badge_request_rejected',
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
      enum: ['Product', 'Booking', 'Review', 'Inquiry', 'Withdrawal', 'Operator', 'OperatorOnboarding', 'BadgeRequest'],
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

// Sprint [8]: notification center listing sorted by recency + unread filtering
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

