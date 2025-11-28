import pkg from 'nodemailer';
const { createTransport } = pkg;

// Check if email is enabled
const isEmailEnabled = () => {
  return process.env.EMAIL_ENABLED !== 'false' && 
         process.env.EMAIL_USER && 
         process.env.EMAIL_PASS;
};

// Create transporter only if email is enabled
let transporter = null;

if (isEmailEnabled()) {
  try {
    transporter = createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add connection timeout
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.warn('⚠️  Email service not configured properly:', error.message);
        console.warn('📧 To enable emails, configure EMAIL_USER and EMAIL_PASS in .env');
        console.warn('📧 Or set EMAIL_ENABLED=false to disable email notifications');
        transporter = null;
      } else {
        console.log('✅ Email service configured successfully');
      }
    });
  } catch (error) {
    console.warn('⚠️  Failed to initialize email service:', error.message);
    transporter = null;
  }
} else {
  console.log('📧 Email service disabled (set EMAIL_ENABLED=false or configure EMAIL_USER/EMAIL_PASS)');
}

// Send booking confirmation email
export const sendBookingConfirmation = async (booking, user) => {
  const mailOptions = {
    from: `"Overglow-Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Booking Confirmation - Overglow-Trip',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #15803d;">Booking Confirmed!</h1>
        <p>Hi ${user.name},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${booking.schedule?.product?.title}</h2>
          <p><strong>Date:</strong> ${new Date(booking.schedule?.date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Time:</strong> ${booking.schedule?.time}</p>
          <p><strong>Tickets:</strong> ${booking.numberOfTickets}</p>
          <p><strong>Total:</strong> €${booking.totalAmount}</p>
          <p><strong>Booking Reference:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
        </div>
        
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>The Overglow-Trip Team</p>
      </div>
    `,
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Email would be sent to:', user.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the booking
    console.error('❌ Error sending booking confirmation email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      console.error('💡 See: https://support.google.com/accounts/answer/185833');
    }
  }
};

// Send cancellation email
export const sendCancellationEmail = async (booking, user) => {
  const mailOptions = {
    from: `"Overglow-Trip" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Booking Cancelled - Overglow-Trip',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Booking Cancelled</h1>
        <p>Hi ${user.name},</p>
        <p>Your booking has been cancelled as requested.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${booking.schedule?.product?.title}</h2>
          <p><strong>Date:</strong> ${new Date(booking.schedule?.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Booking Reference:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Overglow-Trip Team</p>
      </div>
    `,
  };

  // Skip if email is disabled or transporter not available
  if (!transporter || !isEmailEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Email would be sent to:', user.email);
      console.log('📧 [DEV] Subject:', mailOptions.subject);
    }
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Cancellation email sent to:', user.email);
  } catch (error) {
    // Don't throw error, just log it - email failure shouldn't break the cancellation
    console.error('❌ Error sending cancellation email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 Tip: For Gmail, use an App Password instead of your regular password');
      console.error('💡 See: https://support.google.com/accounts/answer/185833');
    }
  }
};
