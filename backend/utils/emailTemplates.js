/**
 * Email templates for transactional emails
 * Responsive HTML templates with inline CSS
 */

const BASE_STYLES = {
  container: 'max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
  header: 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;',
  content: 'background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;',
  button: 'display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;',
  footer: 'background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 8px 8px;',
  infoBox: 'background: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;',
  table: 'width: 100%; border-collapse: collapse; margin: 20px 0;',
  tableRow: 'border-bottom: 1px solid #e5e7eb;',
  tableCell: 'padding: 12px; text-align: left;',
  tableCellLabel: 'font-weight: 600; color: #374151;',
  tableCellValue: 'color: #6b7280;',
};

/**
 * Base email wrapper
 */
const getEmailWrapper = (content, title = 'Overglow Trip') => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="${BASE_STYLES.container}">
    <div style="${BASE_STYLES.header}">
      <h1 style="margin: 0; font-size: 28px;">Overglow Trip</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${title}</p>
    </div>
    <div style="${BASE_STYLES.content}">
      ${content}
    </div>
    <div style="${BASE_STYLES.footer}">
      <p style="margin: 0 0 10px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://overglow-trip.com'}" style="color: #10b981; text-decoration: none;">Visitez notre site</a>
      </p>
      <p style="margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Overglow Trip. Tous droits réservés.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px;">
        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Booking confirmation email template
 */
export const getBookingConfirmationTemplate = (booking, user) => {
  const product = booking.schedule?.product || {};
  const schedule = booking.schedule || {};
  const bookingDate = schedule.date ? new Date(schedule.date) : new Date();
  const bookingRef = booking._id?.toString().slice(-8).toUpperCase() || 'N/A';
  
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Non spécifié';
    return time;
  };

  const content = `
    <h2 style="color: #10b981; margin-top: 0;">✅ Réservation confirmée !</h2>
    
    <p>Bonjour ${user.name || 'Cher client'},</p>
    
    <p>Nous sommes ravis de vous confirmer votre réservation. Voici les détails de votre expérience :</p>
    
    <div style="${BASE_STYLES.infoBox}">
      <h3 style="margin-top: 0; color: #059669;">${product.title || 'Expérience'}</h3>
      <table style="${BASE_STYLES.table}">
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Date :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${formatDate(bookingDate)}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Heure :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${formatTime(schedule.time)}</td>
        </tr>
        ${schedule.endTime ? `
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Fin prévue :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${schedule.endTime}</td>
        </tr>
        ` : ''}
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Nombre de tickets :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${booking.numberOfTickets || 1}</td>
        </tr>
        ${product.location?.address ? `
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Lieu de rendez-vous :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${product.location.address}</td>
        </tr>
        ` : ''}
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Montant total :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><strong style="color: #059669; font-size: 18px;">${booking.totalAmount?.toFixed(2) || '0.00'} €</strong></td>
        </tr>
        <tr>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Référence :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">#${bookingRef}</code></td>
        </tr>
      </table>
    </div>

    ${product.meetingPoint ? `
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h4 style="margin-top: 0; color: #1e40af;">📍 Point de rendez-vous</h4>
      <p style="margin: 0;">${product.meetingPoint}</p>
    </div>
    ` : ''}

    ${product.instructions ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h4 style="margin-top: 0; color: #92400e;">📋 Instructions importantes</h4>
      <p style="margin: 0; white-space: pre-wrap;">${product.instructions}</p>
    </div>
    ` : ''}

    <p>Nous avons hâte de vous accueillir pour cette expérience unique !</p>
    
    <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://overglow-trip.com'}/bookings" style="${BASE_STYLES.button}">Voir mes réservations</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong>Note :</strong> Conservez cette référence (#${bookingRef}) pour toute communication concernant votre réservation.
    </p>
  `;

  return getEmailWrapper(content, 'Confirmation de réservation');
};

/**
 * Booking cancellation email template
 */
export const getCancellationTemplate = (booking, user, refundInfo = null) => {
  const product = booking.schedule?.product || {};
  const schedule = booking.schedule || {};
  const bookingDate = schedule.date ? new Date(schedule.date) : new Date();
  const bookingRef = booking._id?.toString().slice(-8).toUpperCase() || 'N/A';
  
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const content = `
    <h2 style="color: #dc2626; margin-top: 0;">❌ Réservation annulée</h2>
    
    <p>Bonjour ${user.name || 'Cher client'},</p>
    
    <p>Votre réservation a été annulée comme demandé.</p>
    
    <div style="${BASE_STYLES.infoBox}">
      <h3 style="margin-top: 0; color: #dc2626;">Détails de l'annulation</h3>
      <table style="${BASE_STYLES.table}">
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Expérience :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${product.title || 'Expérience'}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Date prévue :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${formatDate(bookingDate)}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Référence :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">#${bookingRef}</code></td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Montant initial :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${booking.totalAmount?.toFixed(2) || '0.00'} €</td>
        </tr>
      </table>
    </div>

    ${refundInfo && refundInfo.refundAmount > 0 ? `
    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h4 style="margin-top: 0; color: #065f46;">💰 Remboursement</h4>
      <p style="margin: 0;">
        <strong>Montant remboursé : ${refundInfo.refundAmount.toFixed(2)} €</strong><br>
        ${refundInfo.refundPercentage ? `(${refundInfo.refundPercentage}% du montant initial)` : ''}
      </p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #065f46;">
        Votre remboursement sera traité dans les 5 à 10 jours ouvrés selon votre méthode de paiement.
      </p>
    </div>
    ` : `
    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <h4 style="margin-top: 0; color: #991b1b;">ℹ️ Remboursement</h4>
      <p style="margin: 0;">
        Aucun remboursement n'est applicable selon la politique d'annulation de cette expérience.
      </p>
    </div>
    `}

    <p>Nous sommes désolés que vous ayez dû annuler votre réservation. Nous espérons vous revoir bientôt !</p>
    
    <p>Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.</p>
  `;

  return getEmailWrapper(content, 'Annulation de réservation');
};

/**
 * Operator new booking notification email template
 */
export const getOperatorBookingNotificationTemplate = (booking, operator, user) => {
  const product = booking.schedule?.product || {};
  const schedule = booking.schedule || {};
  const bookingDate = schedule.date ? new Date(schedule.date) : new Date();
  const bookingRef = booking._id?.toString().slice(-8).toUpperCase() || 'N/A';
  
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const content = `
    <h2 style="color: #10b981; margin-top: 0;">🎉 Nouvelle réservation !</h2>
    
    <p>Bonjour ${operator.companyName || 'Opérateur'},</p>
    
    <p>Vous avez reçu une nouvelle réservation pour votre expérience.</p>
    
    <div style="${BASE_STYLES.infoBox}">
      <h3 style="margin-top: 0; color: #059669;">${product.title || 'Expérience'}</h3>
      <table style="${BASE_STYLES.table}">
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Client :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${user.name || 'Client'}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Email :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${user.email || 'N/A'}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Date :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${formatDate(bookingDate)}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Heure :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${schedule.time || 'Non spécifié'}</td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Nombre de tickets :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><strong>${booking.numberOfTickets || 1}</strong></td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Montant total :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><strong style="color: #059669; font-size: 18px;">${booking.totalAmount?.toFixed(2) || '0.00'} €</strong></td>
        </tr>
        <tr>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Référence :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">#${bookingRef}</code></td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://overglow-trip.com'}/operator/bookings" style="${BASE_STYLES.button}">Voir la réservation</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong>Action requise :</strong> Veuillez préparer l'expérience et confirmer la disponibilité pour cette date.
    </p>
  `;

  return getEmailWrapper(content, 'Nouvelle réservation');
};

/**
 * Refund processed email template
 */
export const getRefundProcessedTemplate = (withdrawal, user) => {
  const content = `
    <h2 style="color: #10b981; margin-top: 0;">✅ Remboursement effectué</h2>
    
    <p>Bonjour ${user.name || 'Cher client'},</p>
    
    <p>Nous avons le plaisir de vous informer que votre remboursement a été traité avec succès.</p>
    
    <div style="${BASE_STYLES.infoBox}">
      <table style="${BASE_STYLES.table}">
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Montant remboursé :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}"><strong style="color: #059669; font-size: 18px;">${withdrawal.amount?.toFixed(2) || '0.00'} €</strong></td>
        </tr>
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Méthode de paiement :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${withdrawal.paymentMethod || 'Virement bancaire'}</td>
        </tr>
        ${withdrawal.processedAt ? `
        <tr style="${BASE_STYLES.tableRow}">
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellLabel}">Date de traitement :</td>
          <td style="${BASE_STYLES.tableCell} ${BASE_STYLES.tableCellValue}">${new Date(withdrawal.processedAt).toLocaleDateString('fr-FR')}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p>Le montant devrait apparaître sur votre compte dans les 3 à 5 jours ouvrés selon votre méthode de paiement.</p>
    
    <p>Si vous avez des questions concernant ce remboursement, n'hésitez pas à nous contacter.</p>
  `;

  return getEmailWrapper(content, 'Remboursement effectué');
};

/**
 * Welcome email template (Client / General)
 */
export const getWelcomeEmailTemplate = (user) => {
  const content = `
    <h2 style="color: #10b981; margin-top: 0;">👋 Bienvenue sur Overglow Trip !</h2>
    
    <p>Bonjour ${user.name || 'Cher voyageur'},</p>
    
    <p>Nous sommes ravis de vous compter parmi nous ! Votre compte a été créé avec succès.</p>
    
    <p>Vous pouvez dès à présent explorer et réserver des expériences uniques et authentiques au Maroc.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://overglow-v1-3jqp.vercel.app'}" style="${BASE_STYLES.button}">Explorer les expériences</a>
    </div>
    
    <p>Si vous avez la moindre question, n'hésitez pas à nous contacter.</p>
  `;

  return getEmailWrapper(content, 'Bienvenue sur Overglow Trip');
};

/**
 * Operator Onboarding Pending template (Sent to Operator)
 */
export const getOperatorOnboardingPendingTemplate = (user) => {
  const content = `
    <h2 style="color: #f59e0b; margin-top: 0;">⏳ Votre demande est en cours d'examen</h2>
    
    <p>Bonjour ${user.name || 'Opérateur'},</p>
    
    <p>Nous avons bien reçu votre demande d'inscription en tant qu'opérateur sur Overglow Trip.</p>
    
    <p>Notre équipe est actuellement en train d'examiner vos informations. Ce processus prend généralement entre 24 et 48 heures.</p>
    
    <div style="${BASE_STYLES.infoBox}; border-left-color: #f59e0b; background-color: #fffbeb;">
      <h3 style="margin-top: 0; color: #d97706;">Que se passe-t-il ensuite ?</h3>
      <p style="margin: 0; color: #92400e;">Dès que votre profil sera approuvé, vous recevrez un nouvel email et vous pourrez commencer à créer et publier vos expériences.</p>
    </div>
    
    <p>Merci pour votre patience et à très vite !</p>
  `;

  return getEmailWrapper(content, "Votre demande est en cours d'examen");
};

/**
 * Password reset template
 */
export const getPasswordResetTemplate = (user, resetUrl) => {
  const content = `
    <h2 style="color: #0f766e; margin-top: 0;">🔐 Réinitialisation du mot de passe</h2>
    
    <p>Bonjour ${user.name || 'Cher utilisateur'},</p>
    
    <p>Vous avez demandé la réinitialisation de votre mot de passe Overglow Trip.</p>
    
    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans <strong>1 heure</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="${BASE_STYLES.button}">Réinitialiser mon mot de passe</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
    
    <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">Lien alternatif : ${resetUrl}</p>
  `;

  return getEmailWrapper(content, 'Réinitialisation du mot de passe');
};

/**
 * Operator Approved template
 */
export const getOperatorApprovedTemplate = (user) => {
  const content = `
    <h2 style="color: #10b981; margin-top: 0;">🎉 Félicitations, votre compte est approuvé !</h2>
    
    <p>Bonjour ${user.name || 'Opérateur'},</p>
    
    <p>Excellente nouvelle ! Votre demande d'inscription en tant qu'opérateur a été <strong>approuvée</strong> par notre équipe.</p>
    
    <p>Vous pouvez dès maintenant accéder à votre tableau de bord et commencer à publier vos expériences.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://overglow-v1-3jqp.vercel.app'}/operator/dashboard" style="${BASE_STYLES.button}">Accéder à mon tableau de bord</a>
    </div>
    
    <p>Nous sommes impatients de voir les expériences incroyables que vous allez proposer !</p>
  `;

  return getEmailWrapper(content, 'Votre compte opérateur est approuvé');
};


