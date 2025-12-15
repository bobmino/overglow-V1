import express from 'express';
import { body } from 'express-validator';
import {
  getOrCreateInquiryChat,
  getUserChats,
  getChatById,
  sendMessage,
  markChatAsRead,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const messageValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Le contenu du message est requis')
    .isLength({ max: 5000 })
    .withMessage('Le message ne peut pas dépasser 5000 caractères'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'system'])
    .withMessage('Type de message invalide'),
];

// Routes
router.get('/', getUserChats);
router.get('/inquiry/:inquiryId', getOrCreateInquiryChat);
router.get('/:id', getChatById);
router.post('/:id/messages', messageValidation, sendMessage);
router.put('/:id/read', markChatAsRead);

export default router;

