import express from 'express';
import { body } from 'express-validator';
import {
  getOrCreateInquiryChat,
  getOrCreateSupportChat,
  getUserChats,
  getChatById,
  sendMessage,
  markChatAsRead,
  setTyping,
  getTyping,
  getUnreadChatCount,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

const messageValidation = [
  body('content')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Le message ne peut pas dépasser 5000 caractères'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'system'])
    .withMessage('Type de message invalide'),
];

// [PROMPT-6] Static paths before :id
router.get('/conversations', getUserChats);
router.get('/unread-count', getUnreadChatCount);
router.get('/', getUserChats);
router.get('/support', getOrCreateSupportChat);
router.get('/inquiry/:inquiryId', getOrCreateInquiryChat);
router.get('/:id/typing', getTyping);
router.post('/:id/typing', setTyping);
router.get('/:id', getChatById);
router.post('/:id/messages', messageValidation, sendMessage);
router.put('/:id/read', markChatAsRead);

export default router;
