import pkg from 'nodemailer';
const { createTransport } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function testSmtp() {
  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log(`Connecting to ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} with ${process.env.EMAIL_USER}...`);
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('💡 This usually means Gmail is blocking access because an App Password is required.');
    }
  }
}
testSmtp();
