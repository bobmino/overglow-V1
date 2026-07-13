import { Chat, Message } from '../models/chatModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';
import { generateAIResponse } from '../services/aiService.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { sanitizeText } from '../utils/sanitizer.js';

// @desc    Get or create chat for inquiry
// @route   GET /api/chat/inquiry/:inquiryId
// @access  Private
const getOrCreateInquiryChatHandler = async (req, res) => {
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
    const messages = await Message.find({
      $or: [
        { chat: chat._id },
        { chat: chat._id.toString() }
      ]
    })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.json({
      chat,
      messages,
    });
  } catch (error) {
    logger.error('Get or create inquiry chat error:', error);
    res.status(500).json({ message: 'Failed to get or create chat' });
  }
};

// @desc    Get user chats
// @route   GET /api/chat
// @access  Private
const getUserChatsHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = String(req.user.role || '').toLowerCase();
    const isAdmin = ['admin', 'administrator', 'superadmin'].includes(role);

    const query = isAdmin
      ? { isActive: true }
      : { participants: userId, isActive: true };

    const chats = await Chat.find(query)
      .populate('participants', 'name email role')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    const enriched = chats.map((chat) => {
      const obj = chat.toObject();
      const unreadMap = chat.unreadCount instanceof Map
        ? Object.fromEntries(chat.unreadCount)
        : (chat.unreadCount || {});
      obj.unreadForMe = Number(unreadMap[userId.toString()] || 0);
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    logger.error('Get user chats error:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};

/** In-memory typing indicators: chatId -> { userId: expiresAt } */
const typingStore = new Map();

const setTypingHandler = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user._id.toString();
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  const isParticipant = chat.participants.some((p) => p.toString() === userId);
  const role = String(req.user.role || '').toLowerCase();
  const isAdmin = ['admin', 'administrator', 'superadmin'].includes(role);
  if (!isParticipant && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const entry = typingStore.get(chatId) || {};
  entry[userId] = Date.now() + 4000;
  typingStore.set(chatId, entry);
  res.json({ ok: true });
};

const getTypingHandler = async (req, res) => {
  const chatId = req.params.id;
  const me = req.user._id.toString();
  const entry = typingStore.get(chatId) || {};
  const now = Date.now();
  const others = Object.entries(entry)
    .filter(([uid, exp]) => uid !== me && exp > now)
    .map(([uid]) => uid);
  res.json({ typingUserIds: others });
};

const getUnreadChatCountHandler = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const chats = await Chat.find({ participants: req.user._id, isActive: true }).select('unreadCount');
    let count = 0;
    chats.forEach((chat) => {
      if (chat.unreadCount instanceof Map) {
        count += Number(chat.unreadCount.get(userId) || 0);
      } else if (chat.unreadCount && chat.unreadCount[userId]) {
        count += Number(chat.unreadCount[userId] || 0);
      }
    });
    res.json({ count, unreadCount: count });
  } catch (error) {
    logger.error('Get unread chat count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// @desc    Get chat by ID
// @route   GET /api/chat/:id
// @access  Private
const getChatByIdHandler = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name email role');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant (admins can open any chat for inbox)
    const role = String(req.user.role || '').toLowerCase();
    const isAdmin = ['admin', 'administrator', 'superadmin'].includes(role);
    const isParticipant = chat.participants.some(p => p._id.toString() === req.user._id.toString());
    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get messages
    const messages = await Message.find({
      $or: [
        { chat: chat._id },
        { chat: chat._id.toString() }
      ]
    })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    // Mark messages as read for current user
    await Message.updateMany(
      {
        $or: [
          { chat: chat._id },
          { chat: chat._id.toString() }
        ],
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
    logger.error('Get chat by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
};

// @desc    Send message
// @route   POST /api/chat/:id/messages
// @access  Private
const sendMessageHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const { content, type = 'text', attachments = [] } = req.body;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    const rawContent = (content && String(content).trim())
      || (hasAttachments ? (attachments[0]?.name || '[pièce jointe]') : '');
    if (!rawContent) {
      return res.status(400).json({ message: 'Le contenu du message est requis' });
    }
    const safeContent = sanitizeText(rawContent);

    // Allow admin to reply even if not in participants (support inbox)
    const role = String(req.user.role || '').toLowerCase();
    const isAdmin = ['admin', 'administrator', 'superadmin'].includes(role);
    const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (isAdmin && !isParticipant) {
      chat.participants.push(req.user._id);
      await chat.save();
    }

    const userMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content: safeContent,
      type,
      attachments,
      isAI: false,
    });

    // Skip AI for media / file messages
    if (type !== 'text') {
      chat.lastMessage = userMessage._id;
      chat.lastMessageAt = new Date();
      chat.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
          chat.unreadCount.set(participantId.toString(), currentCount + 1);
        }
      });
      await chat.save();
      await userMessage.populate('sender', 'name email role');
      return res.status(201).json({ userMessage, aiMessage: null });
    }

    // Extraction du destinataire (opérateur / autre participant)
    const receiverId = chat.participants.find((p) => p.toString() !== req.user._id.toString());

    let aiResponse;
    let aiModel = process.env.AI_MODEL?.trim() || 'unknown';
    try {
      aiResponse = await generateAIResponse(safeContent);
      if (aiResponse?.model) aiModel = String(aiResponse.model);
    } catch (error) {
      logger.error('Error generating AI response:', error);
      chat.lastMessage = userMessage._id;
      chat.lastMessageAt = new Date();
      await chat.save();
      await userMessage.populate('sender', 'name email role');
      return res.status(201).json({ userMessage, aiMessage: null });
    }

    const aiTextContent = sanitizeText(
      aiResponse?.choices?.[0]?.message?.content ||
        (typeof aiResponse === 'string' ? aiResponse : 'No response content')
    );

    // [TASK-22] SEC-08 — never present AI text as written by the human user
    const aiSenderId = receiverId || req.user._id;
    const aiMessage = await Message.create({
      chat: chat._id,
      sender: aiSenderId,
      content: aiTextContent,
      type: 'text',
      isAI: true,
      aiMeta: {
        model: aiModel,
        generatedAt: new Date(),
        confidence: typeof aiResponse?.confidence === 'number' ? aiResponse.confidence : undefined,
      },
    });

    logger.info('AI chat interaction logged', {
      chatId: chat._id?.toString(),
      userId: req.user._id?.toString(),
      model: aiModel,
      messageId: aiMessage._id?.toString(),
    });

    chat.lastMessage = aiMessage._id;
    chat.lastMessageAt = new Date();

    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();
    await userMessage.populate('sender', 'name email role');
    await aiMessage.populate('sender', 'name email role');

    res.status(201).json({ userMessage, aiMessage });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// @desc    Mark chat as read
// @route   PUT /api/chat/:id/read
// @access  Private
const markChatAsReadHandler = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        $or: [
          { chat: chat._id },
          { chat: chat._id.toString() }
        ],
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
    logger.error('Mark chat as read error:', error);
    res.status(500).json({ message: 'Failed to mark chat as read' });
  }
};

// @desc    Get or create support chat for current user
// @route   GET /api/chat/support
// @access  Private
const getOrCreateSupportChatHandler = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the admin user
    const adminUser = await User.findOne({ role: 'Admin' });
    if (!adminUser) {
      return res.status(404).json({ message: 'Support agent (Admin) not found' });
    }

    // Find existing support chat between this user and the admin
    let chat = await Chat.findOne({
      type: 'support',
      participants: { $all: [userId, adminUser._id] },
      isActive: true,
    }).populate('participants', 'name email role');

    if (!chat) {
      // Create new support chat
      chat = await Chat.create({
        participants: [userId, adminUser._id],
        type: 'support',
        unreadCount: new Map([
          [userId.toString(), 0],
          [adminUser._id.toString(), 0],
        ]),
      });

      await chat.populate('participants', 'name email role');
    }

    // Get messages
    const messages = await Message.find({
      $or: [
        { chat: chat._id },
        { chat: chat._id.toString() }
      ]
    })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.json({
      chat,
      messages,
    });
  } catch (error) {
    logger.error('Get or create support chat error:', error);
    res.status(500).json({ message: 'Failed to get or create support chat' });
  }
};

export const getOrCreateInquiryChat = asyncHandler(getOrCreateInquiryChatHandler);
export const getOrCreateSupportChat = asyncHandler(getOrCreateSupportChatHandler);
export const getUserChats = asyncHandler(getUserChatsHandler);
export const getConversations = getUserChats; // [PROMPT-6] alias
export const getChatById = asyncHandler(getChatByIdHandler);
export const sendMessage = asyncHandler(sendMessageHandler);
export const markChatAsRead = asyncHandler(markChatAsReadHandler);
export const markConversationRead = markChatAsRead; // [PROMPT-6] alias
export const setTyping = asyncHandler(setTypingHandler);
export const getTyping = asyncHandler(getTypingHandler);
export const getUnreadChatCount = asyncHandler(getUnreadChatCountHandler);


