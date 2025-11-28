import mongoose from 'mongoose';

const approvalRequestSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  entityType: {
    type: String,
    enum: ['Product', 'Review', 'Operator'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
  message: {
    type: String,
  },
  // Track if user has already requested approval for this entity
  isUnique: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure one request per user per entity
approvalRequestSchema.index({ user: 1, entityType: 1, entityId: 1 }, { unique: true });

const ApprovalRequest = mongoose.model('ApprovalRequest', approvalRequestSchema);

export default ApprovalRequest;

