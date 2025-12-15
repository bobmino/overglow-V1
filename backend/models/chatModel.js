import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Le contenu du message est requis'],
      trim: true,
      maxlength: [5000, 'Le message ne peut pas dépasser 5000 caractères'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachments: [{
      url: String,
      type: String,
      name: String,
    }],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    type: {
      type: String,
      enum: ['inquiry', 'support', 'operator'],
      default: 'support',
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ['inquiry', 'booking', 'product'],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add chat reference to message schema
messageSchema.add({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, isActive: 1 });
chatSchema.index({ relatedEntity: 1 });
chatSchema.index({ lastMessageAt: -1 });

// Create a compound model for messages within chats
const Message = mongoose.model('Message', messageSchema);

const Chat = mongoose.model('Chat', chatSchema);

export { Chat, Message };

