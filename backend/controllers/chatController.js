import { Chat, Message } from '../models/chatModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';

// @desc    Get or create chat for inquiry
// @route   GET /api/chat/inquiry/:inquiryId
// @access  Private
const getOrCreateInquiryChat = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const userId = req.user._id;

    // Find existing chat for this inquiry
    let chat = await Chat.findOne({
      type: 'inquiry',
      'relatedEntity.type': 'inquiry',
      'relatedEntity.id': inquiryId,
      participants: userId,
      isActive: true,
    }).populate('participants', 'name email role');

    if (!chat) {
      // Get inquiry to find operator
      const Inquiry = (await import('../models/inquiryModel.js')).default;
      const inquiry = await Inquiry.findById(inquiryId)
        .populate('product')
        .populate('operator', 'user');

      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      // Get operator user ID
      const operator = await User.findById(inquiry.operator?.user);
      if (!operator) {
        return res.status(404).json({ message: 'Operator not found' });
      }

      // Create new chat
      chat = await Chat.create({
        participants: [userId, operator._id],
        type: 'inquiry',
        relatedEntity: {
          type: 'inquiry',
          id: inquiryId,
        },
        unreadCount: new Map([
          [userId.toString(), 0],
          [operator._id.toString(), 0],
        ]),
      });

      await chat.populate('participants', 'name email role');
    }

    // Get messages
    const messages = await Message.find({ _id: { $in: chat.messages || [] } })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.json({
      chat,
      messages,
    });
  } catch (error) {
    console.error('Get or create inquiry chat error:', error);
    res.status(500).json({ message: 'Failed to get or create chat' });
  }
};

// @desc    Get user chats
// @route   GET /api/chat
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};

// @desc    Get chat by ID
// @route   GET /api/chat/:id
// @access  Private
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name email role');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get messages
    const messages = await Message.find({ chat: chat._id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    // Mark messages as read for current user
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count for current user
    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();

    res.json({
      chat,
      messages,
    });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
};

// @desc    Send message
// @route   POST /api/chat/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { content, type = 'text', attachments = [] } = req.body;

    // Create message
    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content,
      type,
      attachments,
    });

    // Update chat
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();

    // Update unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    await message.populate('sender', 'name email role');

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// @desc    Mark chat as read
// @route   PUT /api/chat/:id/read
// @access  Private
const markChatAsRead = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({ message: 'Failed to mark chat as read' });
  }
};

export {
  getOrCreateInquiryChat,
  getUserChats,
  getChatById,
  sendMessage,
  markChatAsRead,
};

