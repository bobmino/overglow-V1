import EventEmitter from 'events';
// Sprint [8]: consolidated on backend/utils/emailService.js (single provider + retry)
// instead of the legacy Resend-only sender, which used to fire a second, duplicate
// confirmation email alongside the nodemailer one sent directly by the controllers.
import { sendBookingConfirmation } from '../utils/emailService.js';

class NotificationHub extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    // Écouteur pour l'événement BOOKING_SUCCESS
    this.on('BOOKING_SUCCESS', async (payload) => {
      const { to, booking, user, whatsappLink } = payload;
      const recipient = to || user?.email;

      const emailPromise = sendBookingConfirmation(
        booking,
        { ...user, email: recipient },
        null,
        whatsappLink,
      );

      const operatorLogPromise = (async () => {
        const bookingId = booking?._id || 'N/A';
        const operatorId = booking?.schedule?.product?.operator || booking?.product?.operator || 'N/A';
        const clientName = user?.name || 'Inconnu';
        const clientEmail = to || user?.email || 'Inconnu';
        
        console.warn(`[Back-Office Opérateur Alert] NOUVELLE RÉSERVATION RÉUSSIE !`);
        console.warn(`ID Réservation : ${bookingId}`);
        console.warn(`ID Opérateur   : ${operatorId}`);
        console.warn(`Client         : ${clientName} (${clientEmail})`);
        console.warn(`Montant        : €${booking?.totalAmount || 0}`);
        console.warn(`-----------------------------------------------------`);
        
        return { success: true, logged: true };
      })();

      // Exécution asynchrone en arrière-plan avec Promise.allSettled
      const results = await Promise.allSettled([emailPromise, operatorLogPromise]);
      
      // Log des résultats pour monitoring interne
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error(`[NotificationHub Error] Tâche ${idx === 0 ? 'Email' : 'Opérateur Log'} a échoué:`, result.reason);
        } else {
          console.log(`[NotificationHub Success] Tâche ${idx === 0 ? 'Email' : 'Opérateur Log'} exécutée avec succès:`, result.value);
        }
      });
    });
  }

  /**
   * Dispatcher un événement
   * @param {string} eventName - Le nom de l'événement (ex: 'BOOKING_SUCCESS')
   * @param {Object} payload - Les données associées à l'événement
   */
  dispatch(eventName, payload) {
    console.log(`[NotificationHub] Dispatch de l'événement: ${eventName}`);
    this.emit(eventName, payload);
  }
}

const notificationHub = new NotificationHub();
export default notificationHub;
