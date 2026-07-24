import Notification from '../models/notificationModel.js';
import Settings from '../models/settingsModel.js';
import { logger } from './logger.js';

const settingsCache = { at: 0, data: null };
const SETTINGS_CACHE_MS = 15_000;

const getMergedSettings = async () => {
  if (settingsCache.data && Date.now() - settingsCache.at < SETTINGS_CACHE_MS) {
    return settingsCache.data;
  }
  const rows = await Settings.find({}).lean();
  const merged = { ...Settings.getDefaultSettings() };
  rows.forEach((s) => {
    merged[s.key] = s.value;
  });
  settingsCache.at = Date.now();
  settingsCache.data = merged;
  return merged;
};

/** Respecte les toggles Admin → Paramètres → Notifications. */
export const isNotifyEnabled = async (key) => {
  try {
    const settings = await getMergedSettings();
    return settings[key] !== false;
  } catch (err) {
    logger.warn('Settings notify flag fallback (default true)', { key, message: err.message });
    return true;
  }
};

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {String} options.userId - User ID to notify
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {Object} options.relatedEntity - Related entity (type, id)
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEntity = null,
}) => {
  try {
    if (!userId || !type || !title || !message) {
      logger.warn('Missing required fields for notification');
      return null;
    }

    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      relatedEntity,
    });

    await notification.save();
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification for new booking (to operator)
 * Gate: Settings.notifyNewBooking
 */
export const notifyNewBooking = async (booking, operatorId) => {
  if (!(await isNotifyEnabled('notifyNewBooking'))) {
    logger.info('notifyNewBooking skipped (setting off)');
    return null;
  }
  return createNotification({
    userId: operatorId,
    type: 'booking_created',
    title: 'Nouvelle réservation',
    message: `Vous avez reçu une nouvelle réservation pour ${booking.schedule?.product?.title || 'un produit'}`,
    relatedEntity: {
      type: 'Booking',
      id: booking._id,
    },
  });
};

/**
 * Admin alert — nouvel utilisateur inscrit (Client).
 * Gate: Settings.notifyNewUser
 */
export const notifyNewUser = async (user, adminIds) => {
  if (!(await isNotifyEnabled('notifyNewUser'))) {
    logger.info('notifyNewUser skipped (setting off)');
    return [];
  }
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'user_registered',
      title: 'Nouvel utilisateur',
      message: `${user.name || user.email} vient de s’inscrire (${user.role || 'Client'})`,
      relatedEntity: {
        type: 'User',
        id: user._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Paiement reçu / confirmé — alerte destinataires (opérateur / admins).
 * Gate: Settings.notifyPaymentReceived
 */
export const notifyPaymentReceived = async (booking, recipientUserIds = []) => {
  if (!(await isNotifyEnabled('notifyPaymentReceived'))) {
    logger.info('notifyPaymentReceived skipped (setting off)');
    return [];
  }
  const productTitle = booking.schedule?.product?.title || 'une réservation';
  const amount = booking.totalAmount ?? booking.totalPrice ?? 0;
  const message = `Paiement confirmé pour « ${productTitle} » — ${Number(amount).toFixed(2)} MAD`;
  const notifications = [];
  const uniqueIds = [...new Set((recipientUserIds || []).filter(Boolean).map(String))];
  for (const userId of uniqueIds) {
    const notif = await createNotification({
      userId,
      type: 'payment_received',
      title: 'Paiement reçu',
      message,
      relatedEntity: {
        type: 'Booking',
        id: booking._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for product pending review (to admin)
 */
export const notifyProductPending = async (product, adminIds) => {
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'product_pending',
      title: 'Produit en attente de validation',
      message: `Le produit "${product.title}" est en attente de validation`,
      relatedEntity: {
        type: 'Product',
        id: product._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for review pending (to admin)
 */
export const notifyReviewPending = async (review, adminIds) => {
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'review_pending',
      title: 'Avis en attente de modération',
      message: `Un nouvel avis est en attente de modération`,
      relatedEntity: {
        type: 'Review',
        id: review._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for inquiry received (to operator)
 */
export const notifyInquiryReceived = async (inquiry, operatorId) => {
  // Populate product if needed
  let productTitle = 'un produit';
  if (inquiry.product && typeof inquiry.product === 'object' && inquiry.product.title) {
    productTitle = inquiry.product.title;
  } else if (inquiry.product) {
    // If it's just an ID, we'll use a generic message
    productTitle = 'un produit';
  }
  
  return createNotification({
    userId: operatorId,
    type: 'inquiry_received',
    title: 'Nouvelle demande reçue',
    message: `Vous avez reçu une nouvelle demande pour ${productTitle}`,
    relatedEntity: {
      type: 'Inquiry',
      id: inquiry._id,
    },
  });
};

/**
 * Create notification for inquiry answered (to client)
 */
export const notifyInquiryAnswered = async (inquiry, userId) => {
  // Populate product if needed
  let productTitle = 'un produit';
  if (inquiry.product && typeof inquiry.product === 'object' && inquiry.product.title) {
    productTitle = inquiry.product.title;
  } else if (inquiry.product) {
    productTitle = 'un produit';
  }
  
  return createNotification({
    userId,
    type: 'inquiry_answered',
    title: 'Réponse à votre demande',
    message: `L'opérateur a répondu à votre demande pour ${productTitle}`,
    relatedEntity: {
      type: 'Inquiry',
      id: inquiry._id,
    },
  });
};

/**
 * Create notification for approval request (to admin)
 */
export const notifyApprovalRequest = async (approvalRequest, adminIds) => {
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'approval_request',
      title: 'Demande d\'approbation',
      message: `Un utilisateur demande l'approbation pour un ${approvalRequest.entityType}`,
      relatedEntity: {
        type: approvalRequest.entityType,
        id: approvalRequest.entityId,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for product approved (to operator)
 */
export const notifyProductApproved = async (product, operatorId) => {
  return createNotification({
    userId: operatorId,
    type: 'product_approved',
    title: 'Produit approuvé',
    message: `Votre produit "${product.title}" a été approuvé et est maintenant publié`,
    relatedEntity: {
      type: 'Product',
      id: product._id,
    },
  });
};

/**
 * Create notification for review approved (to user)
 */
export const notifyReviewApproved = async (review, userId) => {
  return createNotification({
    userId,
    type: 'review_approved',
    title: 'Avis approuvé',
    message: `Votre avis a été approuvé et est maintenant visible`,
    relatedEntity: {
      type: 'Review',
      id: review._id,
    },
  });
};

/**
 * Create notification for withdrawal request (to admin)
 */
export const notifyWithdrawalRequest = async (withdrawal, adminIds, operatorName = 'un opérateur') => {
  if (!(await isNotifyEnabled('notifyWithdrawalRequested'))) {
    logger.info('notifyWithdrawalRequest skipped (setting off)');
    return [];
  }
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'withdrawal_requested',
      title: 'Demande de retrait',
      message: `Nouveau retrait demandé par ${operatorName}`,
      relatedEntity: {
        type: 'Withdrawal',
        id: withdrawal._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for withdrawal approved (to user)
 */
export const notifyWithdrawalApproved = async (withdrawal, userId) => {
  return createNotification({
    userId,
    type: 'withdrawal_approved',
    title: 'Retrait approuvé',
    message: `Votre retrait de ${withdrawal.amount} MAD a été approuvé`,
    relatedEntity: {
      type: 'Withdrawal',
      id: withdrawal._id,
    },
  });
};

/**
 * Create notification for withdrawal rejected (to user / operator)
 */
export const notifyWithdrawalRejected = async (withdrawal, userId, reason = '') => {
  const reasonText = reason?.trim() ? reason.trim() : 'aucune raison précisée';
  return createNotification({
    userId,
    type: 'withdrawal_rejected',
    title: 'Retrait refusé',
    message: `Votre retrait a été refusé: ${reasonText}`,
    relatedEntity: {
      type: 'Withdrawal',
      id: withdrawal._id,
    },
  });
};

/**
 * Create notification for product rejected (to operator user)
 */
export const notifyProductRejected = async (product, operatorUserId, reason = '') => {
  const reasonText = reason?.trim() ? reason.trim() : 'retourné en brouillon pour modifications';
  return createNotification({
    userId: operatorUserId,
    type: 'product_rejected',
    title: 'Produit refusé',
    message: `Votre produit '${product.title}' a été refusé: ${reasonText}`,
    relatedEntity: {
      type: 'Product',
      id: product._id,
    },
  });
};

/**
 * Notify operator of a new review on their product
 */
export const notifyNewReview = async (review, product, operatorUserId) => {
  return createNotification({
    userId: operatorUserId,
    type: 'new_review',
    title: 'Nouvel avis',
    message: `Nouvel avis sur '${product.title}'`,
    relatedEntity: {
      type: 'Review',
      id: review._id,
    },
  });
};

/**
 * Notify operator of a low rating (≤ 2/5)
 */
export const notifyLowRating = async (review, product, operatorUserId) => {
  return createNotification({
    userId: operatorUserId,
    type: 'low_rating',
    title: 'Avis négatif',
    message: `Avis négatif (${review.rating}/5) sur '${product.title}'`,
    relatedEntity: {
      type: 'Review',
      id: review._id,
    },
  });
};

/**
 * Create notification for refund processed (to client)
 */
export const notifyRefundProcessed = async (withdrawal, userId) => {
  return createNotification({
    userId,
    type: 'refund_processed',
    title: 'Remboursement effectué',
    message: `Votre remboursement de €${withdrawal.amount} a été traité`,
    relatedEntity: {
      type: 'Withdrawal',
      id: withdrawal._id,
    },
  });
};

/**
 * Create notification for new operator registration (to admins)
 */
/**
 * Notify admins of new badge request
 */
export const notifyBadgeRequestSubmitted = async (badgeRequest, product, badge) => {
  try {
    const User = (await import('../models/userModel.js')).default;
    const adminUsers = await User.find({ role: 'Admin' });
    const adminIds = adminUsers.map(admin => admin._id);

    for (const adminId of adminIds) {
      await createNotification({
        userId: adminId,
        type: 'badge_request_submitted',
        title: 'Nouvelle demande de badge',
        message: `Demande de badge "${badge.name}" pour le produit "${product.title}"`,
        relatedEntity: {
          type: 'BadgeRequest',
          id: badgeRequest._id,
        },
      });
    }
  } catch (error) {
    logger.error('Error notifying badge request submitted:', error);
  }
};

/**
 * Notify operator of badge request approval
 */
export const notifyBadgeRequestApproved = async (badgeRequest, operatorUserId) => {
  try {
    await createNotification({
      userId: operatorUserId,
      type: 'badge_request_approved',
      title: 'Demande de badge approuvée',
      message: `Votre demande de badge "${badgeRequest.badge?.name || 'badge'}" a été approuvée`,
      relatedEntity: {
        type: 'BadgeRequest',
        id: badgeRequest._id,
      },
    });
  } catch (error) {
    logger.error('Error notifying badge request approved:', error);
  }
};

/**
 * Notify operator of badge request rejection
 */
export const notifyBadgeRequestRejected = async (badgeRequest, operatorUserId, rejectionReason) => {
  try {
    await createNotification({
      userId: operatorUserId,
      type: 'badge_request_rejected',
      title: 'Demande de badge rejetée',
      message: `Votre demande de badge "${badgeRequest.badge?.name || 'badge'}" a été rejetée. Raison: ${rejectionReason}`,
      relatedEntity: {
        type: 'BadgeRequest',
        id: badgeRequest._id,
      },
    });
  } catch (error) {
    logger.error('Error notifying badge request rejected:', error);
  }
};

export const notifyOperatorRegistered = async (operator, adminIds) => {
  if (!(await isNotifyEnabled('notifyNewUser'))) {
    logger.info('notifyOperatorRegistered skipped (notifyNewUser off)');
    return [];
  }
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'operator_registered',
      title: 'Nouvel opérateur inscrit',
      message: `Un nouvel opérateur "${operator.companyName || 'Sans nom'}" vient de s'inscrire et nécessite une approbation`,
      relatedEntity: {
        type: 'Operator',
        id: operator._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for operator onboarding submitted (to admins)
 */
export const notifyOnboardingSubmitted = async (onboarding, adminIds) => {
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'onboarding_submitted',
      title: 'Nouvelle demande d\'onboarding',
      message: `Un opérateur a soumis son formulaire d'onboarding et attend votre approbation`,
      relatedEntity: {
        type: 'OperatorOnboarding',
        id: onboarding._id,
      },
    });
    if (notif) notifications.push(notif);
  }
  return notifications;
};

/**
 * Create notification for operator approved (to operator)
 */
export const notifyOperatorApproved = async (operator, adminId) => {
  return createNotification({
    userId: operator.user,
    type: 'operator_approved',
    title: 'Compte opérateur approuvé !',
    message: `Votre compte opérateur "${operator.companyName || 'Sans nom'}" a été approuvé. Vous pouvez maintenant publier des produits.`,
    relatedEntity: {
      type: 'Operator',
      id: operator._id,
    },
  });
};

/**
 * Create notification for operator suspended (to operator)
 */
export const notifyOperatorSuspended = async (operator, adminId) => {
  return createNotification({
    userId: operator.user,
    type: 'operator_suspended',
    title: 'Compte opérateur suspendu',
    message: `Votre compte opérateur "${operator.companyName || 'Sans nom'}" a été suspendu. Contactez le support pour plus d'informations.`,
    relatedEntity: {
      type: 'Operator',
      id: operator._id,
    },
  });
};

/**
 * Create notification for operator onboarding approved (to operator)
 */
export const notifyOnboardingApproved = async (onboarding, operatorUserId) => {
  return createNotification({
    userId: operatorUserId,
    type: 'onboarding_approved',
    title: 'Onboarding approuvé !',
    message: `Votre formulaire d'onboarding a été approuvé. Votre compte opérateur est maintenant actif.`,
    relatedEntity: {
      type: 'OperatorOnboarding',
      id: onboarding._id,
    },
  });
};

/**
 * Create notification for operator onboarding rejected (to operator)
 */
export const notifyOnboardingRejected = async (onboarding, operatorUserId, reason) => {
  return createNotification({
    userId: operatorUserId,
    type: 'onboarding_rejected',
    title: 'Onboarding rejeté',
    message: `Votre formulaire d'onboarding a été rejeté.${reason ? ` Raison : ${reason}` : ''}`,
    relatedEntity: {
      type: 'OperatorOnboarding',
      id: onboarding._id,
    },
  });
};

