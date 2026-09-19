import dotenv from 'dotenv';
import tls from 'node:tls';
import { IEmailProvider, SendEmailOptions, EmailProviderResult, EmailProviderType } from './email.types.js';

/**
 * Safe local development provider: logs to console and returns simulated message IDs
 */
export class DevelopmentEmailProvider implements IEmailProvider {
  async send(options: SendEmailOptions): Promise<EmailProviderResult> {
    const msgId = `dev-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH - DEV PROVIDER]`);
    console.log(`Message ID : ${msgId}`);
    console.log(`To         : ${options.to}`);
    console.log(`Subject    : ${options.subject}`);
    console.log(`Template   : ${options.template || 'N/A'}`);
    console.log(`User ID    : ${options.userId || 'N/A'}`);
    console.log(`------------------------------------------------------`);
    console.log(`Text Preview:\n${(options.text || options.html.replace(/<[^>]*>/g, '')).substring(0, 250)}...`);
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: msgId,
    };
  }
}

/**
 * Native Node.js SMTPS Email Provider (Gmail, SendGrid SMTP, Custom SMTP)
 * Zero external dependencies, supports SSL/TLS port 465 and AUTH LOGIN
 */
export class SmtpEmailProvider implements IEmailProvider {
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private fromEmail: string;
  private fromName: string;

  constructor(
    host = 'smtp.gmail.com',
    port = 465,
    user = '',
    pass = '',
    fromEmail = '',
    fromName = 'FluentEdge Academy'
  ) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.pass = pass.replace(/\s+/g, '');
    this.fromEmail = fromEmail || user;
    this.fromName = fromName;
  }

  async send(options: SendEmailOptions): Promise<EmailProviderResult> {
    if (!this.user || !this.pass) {
      return {
        success: false,
        error: 'SMTP credentials missing (SMTP_USER or SMTP_PASS not set).',
      };
    }

    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (res: EmailProviderResult) => {
        if (!resolved) {
          resolved = true;
          cleanUp();
          resolve(res);
        }
      };

      const socket = tls.connect({
        host: this.host,
        port: this.port,
        servername: this.host,
        rejectUnauthorized: false,
      });

      let step = 0;
      let buffer = '';

      const cleanUp = () => {
        try {
          socket.removeAllListeners();
          socket.end();
          socket.destroy();
        } catch (_) {}
      };

      const timeout = setTimeout(() => {
        safeResolve({ success: false, error: 'SMTP connection timed out after 20 seconds' });
      }, 20000);

      socket.on('error', (err) => {
        clearTimeout(timeout);
        safeResolve({ success: false, error: `SMTP Socket Error: ${err.message}` });
      });

      socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\r\n');
        if (!buffer.endsWith('\r\n')) {
          buffer = lines.pop() || '';
        } else {
          buffer = '';
        }

        for (const line of lines) {
          if (!line.trim()) continue;
          // Intermediate multiline SMTP response (e.g. 250-AUTH LOGIN)
          if (/^\d{3}-/.test(line)) continue;

          const code = parseInt(line.substring(0, 3), 10);

          if (step === 0 && code === 220) {
            step = 1;
            socket.write(`EHLO ${this.host}\r\n`);
          } else if (step === 1 && code === 250) {
            step = 2;
            socket.write(`AUTH LOGIN\r\n`);
          } else if (step === 2 && code === 334) {
            step = 3;
            socket.write(Buffer.from(this.user).toString('base64') + '\r\n');
          } else if (step === 3 && code === 334) {
            step = 4;
            socket.write(Buffer.from(this.pass).toString('base64') + '\r\n');
          } else if (step === 4 && code === 235) {
            step = 5;
            const sender = options.fromEmail || this.fromEmail || this.user;
            socket.write(`MAIL FROM:<${sender}>\r\n`);
          } else if (step === 5 && code === 250) {
            step = 6;
            socket.write(`RCPT TO:<${options.to}>\r\n`);
          } else if (step === 6 && code === 250) {
            step = 7;
            socket.write(`DATA\r\n`);
          } else if (step === 7 && code === 354) {
            step = 8;
            const msgId = `<${Date.now()}.${Math.random().toString(36).substring(7)}@${this.host}>`;
            const senderName = options.fromName || this.fromName;
            const senderEmail = options.fromEmail || this.fromEmail || this.user;
            const fromHeader = `"${senderName}" <${senderEmail}>`;
            const date = new Date().toUTCString();
            const subjectEncoded = `=?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`;
            const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const mime = [
              `From: ${fromHeader}`,
              `To: ${options.to}`,
              `Subject: ${subjectEncoded}`,
              `Date: ${date}`,
              `Message-ID: ${msgId}`,
              `MIME-Version: 1.0`,
              `Content-Type: multipart/alternative; boundary="${boundary}"`,
              ...(options.replyTo ? [`Reply-To: ${options.replyTo}`] : []),
              '',
              `--${boundary}`,
              `Content-Type: text/plain; charset=UTF-8`,
              `Content-Transfer-Encoding: base64`,
              '',
              Buffer.from(options.text || options.html.replace(/<[^>]*>/g, '')).toString('base64'),
              '',
              `--${boundary}`,
              `Content-Type: text/html; charset=UTF-8`,
              `Content-Transfer-Encoding: base64`,
              '',
              Buffer.from(options.html).toString('base64'),
              '',
              `--${boundary}--`,
              '',
              '.',
              '',
            ].join('\r\n');

            socket.write(mime);
          } else if (step === 8 && code === 250) {
            step = 9;
            clearTimeout(timeout);
            socket.write(`QUIT\r\n`);
            safeResolve({
              success: true,
              messageId: `smtp-${Date.now()}`,
            });
            return;
          } else if (code >= 400) {
            clearTimeout(timeout);
            safeResolve({
              success: false,
              error: `SMTP Error [${code}]: ${line}`,
            });
            return;
          }
        }
      });
    });
  }
}

/**
 * Resend Email Provider (when RESEND_API_KEY is supplied)
 */
export class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail = 'onboarding@resend.dev') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(options: SendEmailOptions): Promise<EmailProviderResult> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.fromEmail || this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        return {
          success: false,
          error: data.message || `Resend error: ${res.statusText}`,
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to send via Resend',
      };
    }
  }
}

/**
 * Factory to get configured email provider
 */
export class EmailProviderFactory {
  static getProvider(): { provider: IEmailProvider; providerType: EmailProviderType } {
    dotenv.config({ override: true });
    const providerType = (process.env.EMAIL_PROVIDER || '').toUpperCase() as EmailProviderType;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;

    // Check if SMTP credentials are provided
    if (providerType === 'SMTP' || smtpPass) {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const fromEmail = process.env.EMAIL_FROM || smtpUser || 'support@fluentedge.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'FluentEdge Academy';

      return {
        provider: new SmtpEmailProvider(host, port, smtpUser || '', smtpPass || '', fromEmail, fromName),
        providerType: 'SMTP',
      };
    }

    const resendApiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
    if (providerType === 'RESEND' && resendApiKey) {
      return {
        provider: new ResendEmailProvider(resendApiKey, process.env.EMAIL_FROM || 'support@fluentedge.com'),
        providerType: 'RESEND',
      };
    }

    // Default to safe local Development provider
    return {
      provider: new DevelopmentEmailProvider(),
      providerType: 'DEVELOPMENT',
    };
  }
}

