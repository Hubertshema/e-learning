import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

// Force IPv4 DNS resolution for all mail connections (prevents ENETUNREACH on Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/logo.png');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initializes email transport.
   * Auto-detects Resend REST API, Brevo REST API, or Nodemailer SMTP fallback.
   */
  async initTransporter() {
    const provider = env.EMAIL_PROVIDER;
    if (provider === 'brevo' || (env.BREVO_API_KEY && provider !== 'resend')) {
      console.log('🚀 EmailService initialized using Brevo HTTPS API (Port 443) - unrestricted recipients.');
      return;
    }

    if (provider === 'resend' || env.RESEND_API_KEY) {
      console.log('🚀 EmailService initialized using Resend HTTPS API (Port 443) - ideal for Render/Cloud hosting.');
      return;
    }

    const cleanPass = (env.SMTP_PASS || '').replace(/\s+/g, '');
    if (env.SMTP_HOST && env.SMTP_USER && cleanPass) {
      const isGmail = env.SMTP_HOST.includes('gmail') || env.SMTP_USER.includes('gmail');
      const host = env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'localhost');
      const port = Number(env.SMTP_PORT) || 465;
      const isSecure = port === 465 || env.SMTP_SECURE === true;

      const transportConfig = {
        host,
        port,
        secure: isSecure,
        auth: {
          user: env.SMTP_USER,
          pass: cleanPass,
        },
        family: 4, // Force IPv4 socket connection
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000, // 10s connection timeout to fail fast if ports are blocked
        greetingTimeout: 10000,
        socketTimeout: 15000,
      };

      this.transporter = nodemailer.createTransport(transportConfig);
      console.log(`📧 SMTP Transporter configured for host: ${host}:${port} (${env.SMTP_USER}) [IPv4 forced]`);
    } else {
      console.log('ℹ️ Email credentials not configured. EmailService is operating in Console Preview mode.');
    }
  }

  /**
   * Dispatches email via Resend REST API over HTTPS (Port 443).
   * Unrestricted on Render Free Tier.
   */
  async sendViaResend({ to, subject, html, text }) {
    let fromAddress = env.RESEND_FROM;
    if (!fromAddress) {
      if (env.SMTP_FROM && !env.SMTP_FROM.includes('@gmail.com') && !env.SMTP_FROM.includes('@yourdomain.com')) {
        fromAddress = env.SMTP_FROM;
      } else {
        fromAddress = 'LinguaChris Academy <onboarding@resend.dev>';
      }
    }

    const payload = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
    };

    if (fs.existsSync(logoPath)) {
      try {
        const fileBuffer = fs.readFileSync(logoPath);
        payload.attachments = [
          {
            filename: 'linguachris-logo.png',
            content: fileBuffer.toString('base64'),
          },
        ];
      } catch (e) {
        // non-blocking
      }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.message || JSON.stringify(data);
      throw new Error(`Resend API Error: ${errMsg}`);
    }

    console.log(`✉️ Email successfully dispatched via Resend API (HTTPS) to [${to}] - ID: ${data.id}`);
    return { success: true, messageId: data.id, provider: 'resend' };
  }

  /**
   * Dispatches email via Brevo (Sendinblue) REST API over HTTPS (Port 443).
   * Supports free tier sending with registered Gmail accounts.
   */
  async sendViaBrevo({ to, subject, html, text }) {
    const senderMatch = (env.SMTP_FROM || '').match(/^(.*?)\s*<(.+?)>$/);
    const senderName = env.BREVO_FROM_NAME || (senderMatch ? senderMatch[1].trim() : 'LinguaChris Academy');
    const senderEmail = env.BREVO_FROM_EMAIL || (senderMatch ? senderMatch[2].trim() : (env.SMTP_USER || 'admissions@linguachris.com'));

    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: recipients,
      subject,
      htmlContent: html,
      textContent: text || html.replace(/<[^>]*>?/gm, ''),
    };

    if (fs.existsSync(logoPath)) {
      try {
        const fileBuffer = fs.readFileSync(logoPath);
        payload.attachment = [
          {
            name: 'linguachris-logo.png',
            content: fileBuffer.toString('base64'),
          },
        ];
      } catch (e) {
        // non-blocking
      }
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.message || JSON.stringify(data);
      throw new Error(`Brevo API Error: ${errMsg}`);
    }

    console.log(`✉️ Email successfully dispatched via Brevo API (HTTPS) to [${to}] - MessageId: ${data.messageId}`);
    return { success: true, messageId: data.messageId, provider: 'brevo' };
  }

  /**
   * Universal mail dispatcher.
   * Prioritizes HTTPS REST APIs (Resend / Brevo) for cloud compatibility,
   * then falls back to Nodemailer SMTP or Preview console.
   */
  async sendMail({ to, subject, html, text }) {
    try {
      const provider = env.EMAIL_PROVIDER;

      // 1. Brevo REST API (HTTPS port 443 - allows sending to any recipient without domain verification)
      if (provider === 'brevo' || (env.BREVO_API_KEY && provider !== 'resend')) {
        return await this.sendViaBrevo({ to, subject, html, text });
      }

      // 2. Resend REST API (HTTPS port 443)
      if (provider === 'resend' || env.RESEND_API_KEY) {
        return await this.sendViaResend({ to, subject, html, text });
      }

      // 3. Nodemailer SMTP (Localhost or unblocked VPS host)
      if (this.transporter) {
        const attachments = [];
        if (fs.existsSync(logoPath)) {
          attachments.push({
            filename: 'linguachris-logo.png',
            path: logoPath,
            cid: 'linguachris-logo',
          });
        }

        const info = await this.transporter.sendMail({
          from: env.SMTP_FROM,
          to,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html,
          attachments,
        });
        console.log(`✉️ Email successfully dispatched to [${to}] - MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
      }

      // 4. Console Preview Mode
      console.log('\n================== [EMAIL PREVIEW (MOCK TRANSPORT)] ==================');
      console.log(`From:    ${env.SMTP_FROM}`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: \n${text || html.replace(/<[^>]*>?/gm, '').slice(0, 300)}...`);
      console.log('======================================================================\n');
      return { success: true, mock: true, provider: 'preview' };
    } catch (err) {
      console.error(`❌ Failed to send email to [${to}]:`, err.message);

      if (
        err.message?.includes('timeout') ||
        err.message?.includes('ETIMEDOUT') ||
        err.message?.includes('ECONNREFUSED') ||
        err.message?.includes('ENETUNREACH')
      ) {
        console.warn(
          '\n💡 [DEPLOYMENT TIP FOR RENDER]:\n' +
          '   Render Free Tier blocks raw outbound SMTP ports (25, 465, 587).\n' +
          '   To send emails without timeouts on Render, add RESEND_API_KEY in your Render Dashboard.\n' +
          '   (Get your free key at https://resend.com - works over HTTPS Port 443 with 3,000 free emails/month).\n'
        );
      }

      return { success: false, error: err.message };
    }
  }

  /**
   * Executive PRO MODE LinguaChris Branded Email HTML Layout
   * Includes high-res logo, CEFR Accreditation badge, custom typography,
   * security disclaimer seal, direct WhatsApp support, and social media channels.
   */
  renderBaseLayout({ title, preheader = '', contentHtml, actionButton = null }) {
    const frontendUrl = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const isLocal = frontendUrl.includes('localhost');
    const logoSrc = isLocal ? 'cid:linguachris-logo' : `${frontendUrl}/real-logo.png`;
    const buttonHtml = actionButton
      ? `
        <div style="margin: 36px 0 28px; text-align: center;">
          <a href="${actionButton.url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #2563EB 100%); color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.35); letter-spacing: 0.2px;">
            ${actionButton.label} &rarr;
          </a>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; line-height: 1.6;">
        <span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
        
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0B0F19; padding: 40px 12px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45); border: 1px solid #1E293B;">
                
                <!-- PRO Header with Brand Logo & Academic Tagline -->
                <tr>
                  <td style="background: linear-gradient(135deg, #060D1E 0%, #0F172A 50%, #1E1B4B 100%); padding: 36px 40px 30px; text-align: center; border-bottom: 3px solid #4F46E5;">
                    <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" alt="LinguaChris Academy" style="height: 56px; max-width: 260px; object-fit: contain; margin: 0 auto 12px; display: block;" onerror="this.onerror=null;this.src='cid:linguachris-logo';" />
                    </a>
                    
                    <div style="color: #F8FAFC; font-size: 14px; font-weight: 700; letter-spacing: 0.3px; margin-top: 4px;">
                      LinguaChris Academy <span style="color: #818CF8;">•</span> <span style="font-weight: 500; color: #CBD5E1; font-style: italic;">Learn today, Speak tomorrow</span>
                    </div>

                    <div style="margin: 12px auto 0; display: inline-block; background: rgba(79, 70, 229, 0.25); border: 1px solid rgba(129, 140, 248, 0.4); border-radius: 20px; padding: 5px 16px;">
                      <span style="color: #C7D2FE; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
                        ⭐ CEFR-Aligned Curriculum • Verified Certification
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px 42px 32px; background-color: #FFFFFF;">
                    <h2 style="margin: 0 0 18px; color: #0F172A; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; line-height: 1.3;">
                      ${title}
                    </h2>
                    
                    <div style="color: #334155; font-size: 15px; line-height: 1.65;">
                      ${contentHtml}
                    </div>

                    ${buttonHtml}

                    <!-- Security Seal -->
                    <div style="margin: 32px 0 0; padding: 14px 18px; background-color: #F8FAFC; border-radius: 10px; border-left: 4px solid #4F46E5;">
                      <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.5;">
                        🛡️ <strong>Official Notice:</strong> This is an authenticated communication from LinguaChris Academy. Our academic team will never ask you to disclose your password or banking PIN via email.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Social Media & Community Channels -->
                <tr>
                  <td style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 28px 40px; text-align: center;">
                    <p style="margin: 0 0 14px; color: #0F172A; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;">
                      Connect with LinguaChris Global Community
                    </p>

                    <!-- Social Icons Row -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <!-- YouTube -->
                        <td style="padding: 0 8px;">
                          <a href="https://youtube.com/@linguachrisacademy?si=IVC7YguY2jFWylV7" target="_blank" style="display: inline-block; background-color: #FF0000; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 7px 14px; border-radius: 8px;">
                            ▶ YouTube
                          </a>
                        </td>
                        <!-- Instagram -->
                        <td style="padding: 0 8px;">
                          <a href="https://www.instagram.com/linguachris_academy_ltd?stkn=eG5kb3AyNXAydTNl&utm_source=qr" target="_blank" style="display: inline-block; background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF); color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 7px 14px; border-radius: 8px;">
                            📷 Instagram
                          </a>
                        </td>
                        <!-- Facebook -->
                        <td style="padding: 0 8px;">
                          <a href="https://www.facebook.com/share/1KL7TYgEWL/?mibextid=wwXIfr" target="_blank" style="display: inline-block; background-color: #1877F2; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 7px 14px; border-radius: 8px;">
                            👍 Facebook
                          </a>
                        </td>
                        <!-- WhatsApp -->
                        <td style="padding: 0 8px;">
                          <a href="https://wa.me/250782572028" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 7px 14px; border-radius: 8px;">
                            💬 WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- WhatsApp Helpline Callout -->
                    <div style="margin-top: 18px;">
                      <a href="https://wa.me/250782572028" target="_blank" style="display: inline-block; background-color: #FFFFFF; color: #166534; border: 1px solid #BBF7D0; font-size: 12px; font-weight: 600; text-decoration: none; padding: 6px 16px; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        🟢 Direct Admissions WhatsApp Line: <strong>+250 782 572 028</strong>
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Academic Legal & Campus Footer -->
                <tr>
                  <td style="background-color: #0F172A; padding: 26px 40px; text-align: center; color: #94A3B8;">
                    <p style="margin: 0; color: #E2E8F0; font-size: 13px; font-weight: 600;">
                      LinguaChris Academy Ltd.
                    </p>
                    <p style="margin: 6px 0 0; color: #64748B; font-size: 12px;">
                      Kigali, Rwanda &bull; Academic Success & Admissions Panel
                    </p>
                    <p style="margin: 10px 0 0; font-size: 12px;">
                      <a href="${frontendUrl}" style="color: #818CF8; text-decoration: none; margin: 0 6px;">Campus Portal</a> &bull;
                      <a href="${frontendUrl}/courses" style="color: #818CF8; text-decoration: none; margin: 0 6px;">Course Catalog</a> &bull;
                      <a href="${frontendUrl}/quiz" style="color: #818CF8; text-decoration: none; margin: 0 6px;">Diagnostic Quiz</a> &bull;
                      <a href="${frontendUrl}/#verify-certificate" style="color: #818CF8; text-decoration: none; margin: 0 6px;">Verify Certificate</a>
                    </p>
                    <p style="margin: 14px 0 0; color: #475569; font-size: 11px;">
                      © ${new Date().getFullYear()} LinguaChris Academy Ltd. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // -------------------------------------------------------------
  // 1. PUBLIC CONTACT FORM NOTIFICATIONS
  // -------------------------------------------------------------

  /**
   * Notify Admin about a new contact message
   */
  async sendContactNotificationToAdmin({ name, email, phone, subject, message }) {
    const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'admissions@linguachris.com';
    const contentHtml = `
      <p>A new visitor inquiry has been submitted through the public contact portal:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px; overflow: hidden;">
        <tr><td style="padding: 10px 16px; font-weight: bold; color: #334155; width: 120px;">Name:</td><td style="padding: 10px 16px; color: #0F172A;">${name}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold; color: #334155;">Email:</td><td style="padding: 10px 16px; color: #0F172A;"><a href="mailto:${email}" style="color: #4F46E5;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding: 10px 16px; font-weight: bold; color: #334155;">Phone:</td><td style="padding: 10px 16px; color: #0F172A;">${phone}</td></tr>` : ''}
        ${subject ? `<tr><td style="padding: 10px 16px; font-weight: bold; color: #334155;">Subject:</td><td style="padding: 10px 16px; color: #0F172A;">${subject}</td></tr>` : ''}
      </table>
      <div style="background: #F1F5F9; border-left: 4px solid #4F46E5; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-style: italic; color: #1E293B;">"${message}"</p>
      </div>
    `;

    const html = this.renderBaseLayout({
      title: `New Public Inquiry: ${subject || 'General Inquiry'}`,
      preheader: `Inquiry from ${name} (${email})`,
      contentHtml,
      actionButton: {
        label: 'View in Admin Dashboard',
        url: `${env.FRONTEND_URL}/superadmin/contacts`,
      },
    });

    return this.sendMail({
      to: adminEmail,
      subject: `[LinguaChris Contact] ${subject || 'New Inquiry'} from ${name}`,
      html,
    });
  }

  /**
   * Auto-reply to the visitor confirming receipt
   */
  async sendContactAutoReply({ name, email }) {
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for reaching out to <strong>LinguaChris Academy</strong>.</p>
      <p>We have successfully received your inquiry. A member of our academic admissions and student success team is currently reviewing your note and will contact you directly within 24 to 48 hours.</p>
      <p>In the meantime, feel free to explore our CEFR-aligned learning levels or take our quick diagnostic evaluation.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'We Received Your Message',
      preheader: 'Thank you for reaching out to LinguaChris Academy',
      contentHtml,
      actionButton: {
        label: 'Explore Courses & Levels',
        url: `${env.FRONTEND_URL}/levels`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Thank You for Contacting LinguaChris Academy',
      html,
    });
  }

  // -------------------------------------------------------------
  // 2. NEWSLETTER SUBSCRIPTION
  // -------------------------------------------------------------

  async sendNewsletterWelcome({ email }) {
    const contentHtml = `
      <p>Welcome to the <strong>LinguaChris Academy Community</strong>!</p>
      <p>You are now subscribed to receive our latest insights, English language mastery tips, grammar breakdowns, and updates on new cohorts and scholarship opportunities.</p>
      <p>We respect your inbox and only dispatch high-value educational content.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Welcome to LinguaChris Updates',
      preheader: 'You are now subscribed to LinguaChris educational updates',
      contentHtml,
      actionButton: {
        label: 'Browse Campus & Programs',
        url: `${env.FRONTEND_URL}/levels`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Welcome to LinguaChris Academy Updates',
      html,
    });
  }

  // -------------------------------------------------------------
  // 3. PASSWORD RESET & ACCOUNT SECURITY
  // -------------------------------------------------------------

  async sendPasswordResetEmail({ email, name, resetToken }) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const contentHtml = `
      <p>Hello <strong>${name || 'Scholar'}</strong>,</p>
      <p>We received a request to reset the password for your LinguaChris Academy account associated with <strong>${email}</strong>.</p>
      <p>Click the button below to choose a new, secure password. For your protection, this link is valid for <strong>1 hour</strong>.</p>
      <p style="font-size: 13px; color: #64748B;">If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Password Reset Request',
      preheader: 'Instructions to reset your LinguaChris account password',
      contentHtml,
      actionButton: {
        label: 'Reset My Password',
        url: resetUrl,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Reset Your LinguaChris Password',
      html,
    });
  }

  async sendPasswordChangedAlert({ email, name }) {
    const contentHtml = `
      <p>Hello <strong>${name || 'Scholar'}</strong>,</p>
      <p>This is a confirmation that the password for your LinguaChris account (<strong>${email}</strong>) was successfully updated.</p>
      <p>If you made this change, no further action is required.</p>
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px; margin: 18px 0; border-radius: 4px;">
        <p style="margin: 0; color: #991B1B; font-size: 14px; font-weight: 500;">
          If you did NOT perform this action, please reset your password immediately and contact support.
        </p>
      </div>
    `;

    const html = this.renderBaseLayout({
      title: 'Security Notice: Password Changed',
      preheader: 'Your LinguaChris account password was recently changed',
      contentHtml,
      actionButton: {
        label: 'Sign In to Your Account',
        url: `${env.FRONTEND_URL}/login`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Security Alert: Password Changed for LinguaChris',
      html,
    });
  }

  // -------------------------------------------------------------
  // 4. STUDENT APPLICATION & ADMISSION NOTIFICATIONS
  // -------------------------------------------------------------

  async sendApplicationSubmittedToStudent({ email, name, level }) {
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for submitting your official application to <strong>LinguaChris Academy</strong>${level ? ` for the <strong>${level}</strong> program` : ''}.</p>
      <p>Your application dossier has been received and queued for faculty review. Our academic admissions panel evaluates linguistic aptitude, background, and motivation to place each student in their optimal tier.</p>
      <p>You can check the real-time status of your application anytime by signing into your student portal.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Application Received',
      preheader: 'Your application to LinguaChris is under faculty review',
      contentHtml,
      actionButton: {
        label: 'Check Application Status',
        url: `${env.FRONTEND_URL}/login`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Application Received - LinguaChris Academy',
      html,
    });
  }

  async sendNewApplicationAlertToAdmin({ studentName, email, phone, currentEnglishLevel }) {
    const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'admissions@linguachris.com';
    const contentHtml = `
      <p>A new student has submitted an application for admission:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px;">
        <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Applicant:</td><td style="padding: 10px 16px;">${studentName}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Email:</td><td style="padding: 10px 16px;">${email}</td></tr>
        ${phone ? `<tr><td style="padding: 10px 16px; font-weight: bold;">Phone:</td><td style="padding: 10px 16px;">${phone}</td></tr>` : ''}
        ${currentEnglishLevel ? `<tr><td style="padding: 10px 16px; font-weight: bold;">Declared Level:</td><td style="padding: 10px 16px;">${currentEnglishLevel}</td></tr>` : ''}
      </table>
    `;

    const html = this.renderBaseLayout({
      title: 'New Student Application Submitted',
      preheader: `Application from ${studentName}`,
      contentHtml,
      actionButton: {
        label: 'Review in Faculty Portal',
        url: `${env.FRONTEND_URL}/teacher/applications`,
      },
    });

    return this.sendMail({
      to: adminEmail,
      subject: `[Admissions] New Application from ${studentName}`,
      html,
    });
  }

  async sendAdmissionDecisionEmail({ email, name, decision, rejectionReason, levelName }) {
    const isAccepted = decision === 'ACCEPT';
    const contentHtml = isAccepted
      ? `
        <p>Dear <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #166534; font-weight: 600;">
          🎉 Congratulations! We are thrilled to inform you that your application for admission has been ACCEPTED.
        </p>
        <p>You have been admitted to our prestigious curriculum${levelName ? ` at the <strong>${levelName}</strong> tier` : ''}.</p>
        <p>Log in to your student dashboard to review your academic roadmap, complete your tuition payment or enrollment verification, and access your interactive course materials.</p>
      `
      : `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for your interest in LinguaChris Academy and for taking the time to share your learning goals with us.</p>
        <p>After careful evaluation of your dossier, our faculty review board has determined that we are unable to offer you admission for the upcoming term.</p>
        ${rejectionReason ? `<div style="background: #F8FAFC; border-left: 4px solid #CBD5E1; padding: 14px; margin: 16px 0;"><strong style="color: #475569;">Faculty Feedback:</strong><p style="margin: 4px 0 0; color: #334155;">${rejectionReason}</p></div>` : ''}
        <p>We encourage you to continue developing your English skills and invite you to re-apply in our next admissions cycle.</p>
      `;

    const html = this.renderBaseLayout({
      title: isAccepted ? 'Admission Offer - Welcome to LinguaChris!' : 'Application Update from LinguaChris',
      preheader: isAccepted ? 'Your application has been accepted!' : 'Update regarding your application',
      contentHtml,
      actionButton: isAccepted
        ? {
            label: 'Access Student Portal',
            url: `${env.FRONTEND_URL}/login`,
          }
        : null,
    });

    return this.sendMail({
      to: email,
      subject: isAccepted
        ? 'Congratulations: You Have Been Admitted to LinguaChris!'
        : 'Update Regarding Your LinguaChris Application',
      html,
    });
  }

  async sendDirectStudentWelcomeEmail({ email, name, temporaryPassword }) {
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>An official student account has been created for you at <strong>LinguaChris Academy</strong> by our academic faculty.</p>
      <p>Here are your temporary sign-in credentials:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px;">
        <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Portal URL:</td><td style="padding: 10px 16px;"><a href="${env.FRONTEND_URL}/login" style="color: #4F46E5;">${env.FRONTEND_URL}/login</a></td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Email:</td><td style="padding: 10px 16px;">${email}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Temporary Password:</td><td style="padding: 10px 16px; font-family: monospace; font-size: 15px; font-weight: bold; color: #1E293B;">${temporaryPassword}</td></tr>
      </table>
      <p style="font-size: 13px; color: #64748B;">For your security, you will be prompted to choose a permanent password upon your first sign-in.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Welcome to LinguaChris Academy',
      preheader: 'Your student account credentials have been created',
      contentHtml,
      actionButton: {
        label: 'Log In to Campus',
        url: `${env.FRONTEND_URL}/login`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Your LinguaChris Student Account Credentials',
      html,
    });
  }

  // -------------------------------------------------------------
  // 5. PAYMENT VERIFICATION & ACCESS UNLOCK
  // -------------------------------------------------------------

  async sendPaymentProofAdminAlert({ studentName, studentEmail, amount, currency, transactionRef }) {
    const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'admissions@linguachris.com';
    const contentHtml = `
      <p>A student has submitted tuition payment proof requiring verification:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px;">
        <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Student:</td><td style="padding: 10px 16px;">${studentName} (<a href="mailto:${studentEmail}">${studentEmail}</a>)</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Amount:</td><td style="padding: 10px 16px; font-weight: bold; color: #166534;">${amount} ${currency || 'RWF'}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Transaction Ref:</td><td style="padding: 10px 16px; font-family: monospace;">${transactionRef}</td></tr>
      </table>
    `;

    const html = this.renderBaseLayout({
      title: 'Payment Verification Required',
      preheader: `Payment proof submitted by ${studentName}`,
      contentHtml,
      actionButton: {
        label: 'Verify Payment Proof',
        url: `${env.FRONTEND_URL}/teacher/applications`,
      },
    });

    return this.sendMail({
      to: adminEmail,
      subject: `[Billing] New Payment Proof from ${studentName} (${amount} ${currency || 'RWF'})`,
      html,
    });
  }

  async sendPaymentApprovedEmail({ email, name, amount, currency, transactionRef }) {
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #166534; font-weight: 600;">
        ✅ Your tuition payment has been officially verified!
      </p>
      <p>Full <strong>ACTIVE</strong> learning access has been unlocked for your account. You can now access all interactive video courses, assignments, quizzes, live classes, and faculty mentorship.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px;">
        <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Amount Confirmed:</td><td style="padding: 10px 16px;">${amount} ${currency || 'RWF'}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Receipt Reference:</td><td style="padding: 10px 16px; font-family: monospace;">${transactionRef}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Access Status:</td><td style="padding: 10px 16px; font-weight: bold; color: #166534;">ACTIVE</td></tr>
      </table>
    `;

    const html = this.renderBaseLayout({
      title: 'Tuition Payment Confirmed - Access Unlocked',
      preheader: 'Your payment was verified and course access is active',
      contentHtml,
      actionButton: {
        label: 'Launch My Dashboard',
        url: `${env.FRONTEND_URL}/student/dashboard`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Payment Confirmed: Your Course Access is Active!',
      html,
    });
  }

  async sendPaymentRejectedEmail({ email, name, reason }) {
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>Our finance department reviewed the payment proof submitted for your student account, but was unable to verify it at this time.</p>
      ${reason ? `<div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px; margin: 16px 0;"><strong style="color: #991B1B;">Reason:</strong><p style="margin: 4px 0 0; color: #7F1D1D;">${reason}</p></div>` : ''}
      <p>Please log in to your student dashboard to re-upload a clear copy of your bank slip or transaction confirmation SMS.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Payment Verification Notice',
      preheader: 'Action required regarding your tuition payment submission',
      contentHtml,
      actionButton: {
        label: 'Resubmit Payment Proof',
        url: `${env.FRONTEND_URL}/student/admission-status`,
      },
    });

    return this.sendMail({
      to: email,
      subject: 'Action Required: Payment Verification for LinguaChris',
      html,
    });
  }

  // -------------------------------------------------------------
  // 6. LIVE SESSION INVITATIONS
  // -------------------------------------------------------------

  async sendLiveSessionInvitation({ email, name, sessionTitle, scheduledAt, joinUrl }) {
    const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const contentHtml = `
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been invited to a live interactive English session at LinguaChris:</p>
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 16px; margin: 20px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 6px; color: #1E1B4B; font-size: 17px;">${sessionTitle}</h3>
        <p style="margin: 0; color: #4338CA; font-size: 14px; font-weight: 500;">📅 ${formattedDate}</p>
      </div>
      <p>Ensure your camera and microphone are tested before class begins.</p>
    `;

    const html = this.renderBaseLayout({
      title: 'Live Class Invitation',
      preheader: `You are invited to ${sessionTitle}`,
      contentHtml,
      actionButton: {
        label: 'Join Live Classroom',
        url: joinUrl || `${env.FRONTEND_URL}/live-sessions`,
      },
    });

    return this.sendMail({
      to: email,
      subject: `Live Class Invitation: ${sessionTitle}`,
      html,
    });
  }

  // -------------------------------------------------------------
  // 7. COURSE CERTIFICATION & GRADUATION
  // -------------------------------------------------------------

  async sendCertificateIssuedEmail({ email, name, courseName, certificateCode }) {
    const verificationUrl = `${env.FRONTEND_URL}/certificates/${encodeURIComponent(certificateCode)}`;
    const contentHtml = `
      <p>Dear <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #166534; font-weight: 700;">
        🎓 Heartfelt Congratulations on Your Graduation!
      </p>
      <p>You have successfully completed all core curriculum requirements for <strong>${courseName}</strong>.</p>
      <p>Your official accredited Certificate of Completion has been generated and permanently recorded in our public registry.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #F8FAFC; border-radius: 8px;">
        <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px;">Course:</td><td style="padding: 10px 16px;">${courseName}</td></tr>
        <tr><td style="padding: 10px 16px; font-weight: bold;">Certificate Code:</td><td style="padding: 10px 16px; font-family: monospace; font-weight: bold; color: #4F46E5;">${certificateCode}</td></tr>
      </table>
      <p>You can add this credential directly to your LinkedIn profile or share the verification link with employers.</p>
    `;

    const html = this.renderBaseLayout({
      title: `Certificate of Completion: ${courseName}`,
      preheader: `Congratulations ${name}! Your official certificate is ready.`,
      contentHtml,
      actionButton: {
        label: 'View & Share Certificate',
        url: verificationUrl,
      },
    });

    return this.sendMail({
      to: email,
      subject: `🎓 Your Certificate for ${courseName} is Ready!`,
      html,
    });
  }
}

export const emailService = new EmailService();
