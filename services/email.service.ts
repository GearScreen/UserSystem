import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY as string,
});
const domain = process.env.MAILGUN_DOMAIN || 'sandbox123456.mailgun.org';
const from = process.env.MAILGUN_FROM || `noreply@${domain}`;

export class EmailService {
  static async sendEmail(to: string | string[], subject: string, html: string, attachements?: any[]) {
    try {
      const mailOptions = {
        from: from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: this.htmlToText(html),
        attachements
      };
      const data = await mg.messages.create(domain, mailOptions);

      console.log('Mailgun API email sent:', data.id);
      return { success: true, id: data.id };
    } catch (error: any) {
      console.error('Mailgun API error:', error);
      return { success: false, error: error.message };
    }
  }

  static htmlToText(html: string) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static async sendWelcomeEmail(userEmail: string, userName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our App!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for joining our service. We're excited to have you on board!</p>
              <p>Get started by exploring our features.</p>
              <a href="https://app.com/dashboard" class="button">Go to Dashboard</a>
              <p>If you have any questions, reply to this email.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(userEmail, 'Welcome to Our App!', html).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });
  }

  static async sendPasswordResetEmail(userEmail: string, resetToken: string) {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail(userEmail, 'Reset Your Password', html);
  }

  static async sendVerificationEmail(userEmail: string, verificationToken: string) {
    const verifyLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <h2>Verify Your Email</h2>
      <p>Please verify your email address:</p>
      <a href="${verifyLink}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

    return this.sendEmail(userEmail, 'Verify Your Email Address', html).catch((err) => {
      console.error('Failed to send verification email:', err);
    });
  }
}