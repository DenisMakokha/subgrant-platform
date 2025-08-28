const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create transporter for sending emails
const createTransporter = () => {
  // For development, we'll use ethereal.email to test emails
  // In production, you would use a real email service like Gmail, SendGrid, etc.
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@example.com',
        pass: process.env.ETHEREAL_PASS || 'password'
      }
    });
  } else {
    // Production email configuration
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

// Send email notification
const sendEmail = async (to, subject, html, text) => {
  try {
    // Create transporter
    const transporter = createTransporter();
    
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@subgrantplatform.com',
      to,
      subject,
      html,
      text
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent: %s', info.messageId);
    
    // Preview only available when sending through Ethereal
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
const sendNotificationEmail = async (to, notification) => {
  const subject = `Sub-Grant Platform: ${notification.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3f51b5;">${notification.title}</h2>
      <p>${notification.message}</p>
      <p style="font-size: 0.9em; color: #666;">
        This is an automated notification from the Sub-Grant Management Platform.
      </p>
      <p style="font-size: 0.8em; color: #999;">
        If you have any questions, please contact your system administrator.
      </p>
    </div>
  `;
  const text = `${notification.title}\n\n${notification.message}\n\nThis is an automated notification from the Sub-Grant Management Platform.`;
  
  return await sendEmail(to, subject, html, text);
};

module.exports = {
  sendEmail,
  sendNotificationEmail
};