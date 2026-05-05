const formatDate = (rawDate) => {
  if (!rawDate) return 'Date a confirmer';
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return 'Date a confirmer';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatAmount = (value) => {
  const amount = Number(value || 0);
  return `€${amount.toFixed(2)}`;
};

export const getBookingConfirmationPremiumTemplate = ({ booking, user, whatsappLink }) => {
  const productTitle = booking?.schedule?.product?.title || 'Votre experience Overglow';
  const bookingRef = booking?._id ? `#${booking._id.toString().slice(-8).toUpperCase()}` : 'A confirmer';
  const guideWhatsapp = whatsappLink || booking?.schedule?.product?.operatorWhatsapp || '';
  const whatsappUrl = guideWhatsapp
    ? `https://wa.me/${String(guideWhatsapp).replace(/\D+/g, '')}`
    : null;

  const html = `
  <div style="background:#f4f7fb;padding:30px 12px;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(120deg,#0f172a,#1d4ed8);padding:22px 24px;color:#fff;">
        <div style="font-size:22px;font-weight:800;letter-spacing:.4px;">Overglow</div>
        <div style="font-size:13px;opacity:.9;margin-top:6px;">E-ticket de confirmation</div>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 10px 0;font-size:22px;">Reservation confirmee</h2>
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
          Bonjour ${user?.name || 'voyageur'}, votre reservation est bien enregistree. Retrouvez votre recapitulatif ci-dessous.
        </p>
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f8fafc;">
          <p style="margin:0 0 8px 0;font-weight:700;">${productTitle}</p>
          <p style="margin:0 0 6px 0;font-size:14px;"><strong>Date:</strong> ${formatDate(booking?.schedule?.date)}</p>
          <p style="margin:0 0 6px 0;font-size:14px;"><strong>Heure:</strong> ${booking?.schedule?.time || 'A confirmer'}</p>
          <p style="margin:0 0 6px 0;font-size:14px;"><strong>Billets:</strong> ${booking?.numberOfTickets || 1}</p>
          <p style="margin:0 0 6px 0;font-size:14px;"><strong>Total:</strong> ${formatAmount(booking?.totalAmount)}</p>
          <p style="margin:0;font-size:14px;"><strong>Reference:</strong> ${bookingRef}</p>
        </div>
        ${
          whatsappUrl
            ? `<div style="margin-top:18px;">
                <a href="${whatsappUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
                  Contacter mon guide sur WhatsApp
                </a>
              </div>`
            : ''
        }
        <p style="margin-top:18px;font-size:12px;color:#64748b;">
          Astuce: conservez cet email comme e-ticket. Une version PDF pourra etre ajoutee automatiquement ulterieurement.
        </p>
      </div>
    </div>
  </div>
  `;

  return {
    subject: 'Votre e-ticket Overglow - Reservation confirmee',
    html,
    pdf: {
      enabled: false,
      // Placeholder for future integration (react-pdf/html-pdf)
      payload: {
        title: 'E-ticket Overglow',
        bookingReference: bookingRef,
        productTitle,
      },
    },
  };
};
