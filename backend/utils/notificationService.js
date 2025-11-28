import Notification from '../models/notificationModel.js';

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
      console.warn('Missing required fields for notification');
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
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification for new booking (to operator)
 */
export const notifyNewBooking = async (booking, operatorId) => {
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
export const notifyWithdrawalRequest = async (withdrawal, adminIds) => {
  const notifications = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      userId: adminId,
      type: 'withdrawal_requested',
      title: 'Demande de retrait',
      message: `Nouvelle demande de retrait de €${withdrawal.amount}`,
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
    message: `Votre demande de retrait de €${withdrawal.amount} a été approuvée`,
    relatedEntity: {
      type: 'Withdrawal',
      id: withdrawal._id,
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
export const notifyOperatorRegistered = async (operator, adminIds) => {
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

