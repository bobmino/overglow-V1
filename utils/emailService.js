import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
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

  try {
    await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent to:', user.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
