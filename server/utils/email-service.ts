// Email service using Resend
// To use: Install resend package and set RESEND_API_KEY in environment variables
// npm install resend

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
// Resend requires verified domain - use connect@paidin.io or configure in Resend dashboard
const fromEmail = process.env.FROM_EMAIL;
const supportEmail = process.env.SUPPORT_EMAIL || process.env.FROM_EMAIL || 'support@paidin.io';

if (!fromEmail && process.env.NODE_ENV === 'production') {
  throw new Error('FROM_EMAIL environment variable is required in production');
}

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationToken: string;
  verificationUrl: string;
}

export interface PaymentReminderData {
  email: string;
  firstName: string;
  plan: string;
  daysRemaining: number;
  paymentUrl: string;
}

export interface AdminNotificationData {
  to: string; // Admin email
  newUser: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    signupDate: Date;
    plan?: string;
  };
}

export async function sendPaymentReminderEmail(data: PaymentReminderData): Promise<void> {
  if (!resend) {
    console.warn('Resend API key not configured. Payment reminder email would be sent to:', data.email);
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  const planNames: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
  };

  const urgency = data.daysRemaining === 1 ? 'Your trial ends tomorrow!' : 
                  data.daysRemaining <= 3 ? 'Your trial is ending soon!' :
                  'Don\'t lose access to your trial';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `${data.daysRemaining === 1 ? 'Final reminder: ' : ''}${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''} left in your PaidIn trial`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${urgency}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${urgency}</h1>
            </div>
            <div style="background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.firstName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Your ${planNames[data.plan] || data.plan} plan trial has <strong>${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''} remaining</strong>. 
                Add a payment method to continue using PaidIn without interruption.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.paymentUrl}" 
                   style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Add Payment Method
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; margin-bottom: 10px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${data.paymentUrl}
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Questions? Reply to this email or contact us at ${supportEmail}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} PaidIn. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
${urgency}

Hi ${data.firstName},

Your ${planNames[data.plan] || data.plan} plan trial has ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''} remaining. 
Add a payment method to continue using PaidIn without interruption.

Click this link to add payment: ${data.paymentUrl}

Questions? Reply to this email or contact us at connect@paidin.io

© ${new Date().getFullYear()} PaidIn. All rights reserved.
      `.trim(),
    });
  } catch (error: any) {
    console.error('Failed to send payment reminder email:', error);
    throw new Error('Failed to send payment reminder email. Please try again.');
  }
}

export async function sendVerificationEmail(data: EmailVerificationData): Promise<void> {
  if (!resend) {
    console.warn('Resend API key not configured. Email verification email would be sent to:', data.email);
    console.warn('Verification URL:', data.verificationUrl);
    // In development, we can skip actually sending emails
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  // Construct logo URL from APP_URL
  const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : 'https://app.paidin.io');
  const logoUrl = `${appUrl}/favicon/paidin-logo.png`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: 'Verify your PaidIn account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Verify your PaidIn account</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Logo Section -->
                    <tr>
                      <td style="text-align: center; padding: 40px 20px 30px 20px; background-color: #ffffff;">
                        <img src="${logoUrl}" alt="PaidIn Logo" style="height: 64px; width: 64px; border-radius: 50%; display: block; margin: 0 auto; object-fit: cover;" />
                      </td>
                    </tr>
                    
                    <!-- Header with Solid Orange -->
                    <tr>
                      <td style="background-color: #f97316; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to PaidIn!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 20px 0;">Hi ${data.firstName},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 30px 0;">
                          Thank you for signing up for PaidIn! To complete your registration and start managing your Bitcoin business operations, please verify your email address.
                        </p>
                        
                        <!-- Orange Button (Solid Color for Email Client Compatibility) -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td align="center" style="padding: 30px 0;">
                              <a href="${data.verificationUrl}" 
                                 style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 30px 0 15px 0;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin: 0 0 30px 0; font-family: 'Courier New', monospace;">
                          ${data.verificationUrl}
                        </p>
                        
                        <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin: 30px 0 0 0;">
                          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center; margin: 0;">
                          © ${new Date().getFullYear()} PaidIn. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
Welcome to PaidIn!

Hi ${data.firstName},

Thank you for signing up for PaidIn! To complete your registration and start managing your Bitcoin business operations, please verify your email address.

Click this link to verify: ${data.verificationUrl}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} PaidIn. All rights reserved.
      `.trim(),
    });
  } catch (error: any) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
}

export async function sendAdminNotificationEmail(data: AdminNotificationData): Promise<void> {
  if (!resend) {
    console.warn('Resend API key not configured. Admin notification email would be sent to:', data.to);
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Admin Notification (dev mode):', {
        to: data.to,
        newUser: data.newUser,
      });
      return;
    }
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.');
  }

  const appUrl = process.env.APP_URL || 'https://app.paidin.io';
  const adminUrl = `${appUrl}/admin`;
  const signupDate = new Date(data.newUser.signupDate).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: `🔔 New PaidIn Signup: ${data.newUser.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New PaidIn Signup</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 30px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🔔 New User Signup</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                          A new user has signed up for PaidIn:
                        </p>
                        
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">User:</strong>
                              <span style="color: #6b7280; margin-left: 8px;">${data.newUser.firstName} ${data.newUser.lastName}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">Username:</strong>
                              <span style="color: #6b7280; margin-left: 8px;">${data.newUser.username}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">Email:</strong>
                              <span style="color: #6b7280; margin-left: 8px;">${data.newUser.email}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">Company:</strong>
                              <span style="color: #6b7280; margin-left: 8px;">${data.newUser.companyName}</span>
                            </td>
                          </tr>
                          ${data.newUser.plan ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">Plan:</strong>
                              <span style="color: #6b7280; margin-left: 8px; text-transform: capitalize;">${data.newUser.plan}</span>
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #111827;">Signup Date:</strong>
                              <span style="color: #6b7280; margin-left: 8px;">${signupDate}</span>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${adminUrl}" 
                             style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                            View in Admin Console
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          © ${new Date().getFullYear()} PaidIn. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `
New PaidIn Signup

A new user has signed up for PaidIn:

User: ${data.newUser.firstName} ${data.newUser.lastName}
Username: ${data.newUser.username}
Email: ${data.newUser.email}
Company: ${data.newUser.companyName}
${data.newUser.plan ? `Plan: ${data.newUser.plan}` : ''}
Signup Date: ${signupDate}

View in Admin Console: ${adminUrl}

© ${new Date().getFullYear()} PaidIn. All rights reserved.
      `.trim(),
    });
  } catch (error: any) {
    console.error('Failed to send admin notification email:', error);
    throw new Error('Failed to send admin notification email. Please try again.');
  }
}
