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

// Partner onboarding email templates
const sendVerificationEmail = async (to, firstName, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/verify?token=${verificationToken}`;
  
  const subject = 'Verify your Sub-Grant Platform account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3f51b5; margin: 0;">Sub-Grant Platform</h1>
        <p style="color: #666; margin: 5px 0;">Partner Onboarding</p>
      </div>
      
      <h2 style="color: #333;">Welcome ${firstName}!</h2>
      
      <p>Thank you for registering with the Sub-Grant Platform. To complete your registration and begin the partner onboarding process, please verify your email address.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #3f51b5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      
      <p style="font-size: 0.9em; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      
      <p style="font-size: 0.9em; color: #666;">
        This verification link will expire in 24 hours.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">
        Sub-Grant Management Platform<br>
        If you didn't create this account, please ignore this email.
      </p>
    </div>
  `;
  
  const text = `Welcome ${firstName}!\n\nThank you for registering with the Sub-Grant Platform. Please verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, please ignore this email.`;
  
  return await sendEmail(to, subject, html, text);
};

const sendSubmissionReceivedEmail = async (to, firstName, section) => {
  const subject = `Submission received - ${section}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3f51b5; margin: 0;">Sub-Grant Platform</h1>
        <p style="color: #666; margin: 5px 0;">Partner Onboarding</p>
      </div>
      
      <h2 style="color: #333;">Submission Received</h2>
      
      <p>Dear ${firstName},</p>
      
      <p>We have successfully received your ${section} submission. Thank you for completing this step of the onboarding process.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #333;"><strong>What's next?</strong></p>
        <p style="margin: 10px 0 0 0; color: #666;">
          ${section === 'Section C (Attachments)' ? 'Please proceed to complete your financial assessment (Section B).' : 
            section === 'Section B (Financial Assessment)' ? 'Your submission is now under review by our team. We will notify you of the outcome within 5-7 business days.' : 
            'Your onboarding is now complete! Welcome to the Sub-Grant Platform.'}
        </p>
      </div>
      
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">
        Sub-Grant Management Platform
      </p>
    </div>
  `;
  
  const text = `Dear ${firstName},\n\nWe have successfully received your ${section} submission. Thank you for completing this step of the onboarding process.\n\nIf you have any questions, please contact our support team.`;
  
  return await sendEmail(to, subject, html, text);
};

const sendChangesRequestedEmail = async (to, firstName, flags) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/onboarding/review`;
  
  const subject = 'Changes requested for your application';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3f51b5; margin: 0;">Sub-Grant Platform</h1>
        <p style="color: #666; margin: 5px 0;">Partner Onboarding</p>
      </div>
      
      <h2 style="color: #333;">Changes Requested</h2>
      
      <p>Dear ${firstName},</p>
      
      <p>Thank you for your submission. Our review team has identified some items that need attention before we can proceed with your application.</p>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin: 0 0 10px 0;">Items requiring attention:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #856404;">
          ${flags.map(flag => `<li>${flag.comment}</li>`).join('')}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #3f51b5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Review and Update Application
        </a>
      </div>
      
      <p>Please log in to your account and address the items listed above. Once you've made the necessary changes, resubmit your application for review.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">
        Sub-Grant Management Platform
      </p>
    </div>
  `;
  
  const text = `Dear ${firstName},\n\nChanges have been requested for your application. Please log in to review and update: ${loginUrl}\n\nItems requiring attention:\n${flags.map(flag => `- ${flag.comment}`).join('\n')}`;
  
  return await sendEmail(to, subject, html, text);
};

const sendApprovedEmail = async (to, firstName) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/onboarding/section-a`;
  
  const subject = 'Application approved - Complete final steps';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3f51b5; margin: 0;">Sub-Grant Platform</h1>
        <p style="color: #666; margin: 5px 0;">Partner Onboarding</p>
      </div>
      
      <h2 style="color: #28a745;">🎉 Application Approved!</h2>
      
      <p>Dear ${firstName},</p>
      
      <p>Congratulations! Your application has been approved by our review team.</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; color: #155724;"><strong>Final Step Required</strong></p>
        <p style="margin: 10px 0 0 0; color: #155724;">
          Please complete your final organization profile (Section A) to finalize your onboarding.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" 
           style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Complete Final Profile
        </a>
      </div>
      
      <p>You're almost there! Complete this final step to gain full access to the Sub-Grant Platform.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">
        Sub-Grant Management Platform
      </p>
    </div>
  `;
  
  const text = `Dear ${firstName},\n\nCongratulations! Your application has been approved.\n\nPlease complete your final organization profile: ${loginUrl}`;
  
  return await sendEmail(to, subject, html, text);
};

const sendOnboardingCompletedEmail = async (to, firstName, organizationName) => {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard`;
  
  const subject = 'Welcome to Sub-Grant Platform - Onboarding Complete!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3f51b5; margin: 0;">Sub-Grant Platform</h1>
        <p style="color: #666; margin: 5px 0;">Welcome!</p>
      </div>
      
      <h2 style="color: #28a745;">🎉 Onboarding Complete!</h2>
      
      <p>Dear ${firstName},</p>
      
      <p>Welcome to the Sub-Grant Platform! Your onboarding for <strong>${organizationName}</strong> has been successfully completed.</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; color: #155724;"><strong>You now have access to:</strong></p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #155724;">
          <li>Grant application management</li>
          <li>Financial reporting tools</li>
          <li>Document management system</li>
          <li>Compliance tracking</li>
          <li>Partner collaboration features</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" 
           style="background-color: #3f51b5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Access Your Dashboard
        </a>
      </div>
      
      <p>If you need any assistance getting started, our support team is here to help.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 0.8em; color: #999; text-align: center;">
        Sub-Grant Management Platform<br>
        Thank you for choosing us as your grants management partner.
      </p>
    </div>
  `;
  
  const text = `Dear ${firstName},\n\nWelcome to the Sub-Grant Platform! Your onboarding for ${organizationName} has been successfully completed.\n\nAccess your dashboard: ${dashboardUrl}`;
  
  return await sendEmail(to, subject, html, text);
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendVerificationEmail,
  sendSubmissionReceivedEmail,
  sendChangesRequestedEmail,
  sendApprovedEmail,
  sendOnboardingCompletedEmail
};