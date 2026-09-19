import { EmailTemplateType, SendEmailOptions } from './email.types.js';
import { EmailTemplateRegistry } from './email.templates.js';
import { emailQueue } from './email.queue.js';
import { prisma } from '../../config/database.js';

export class EmailService {
  /**
   * Send a rendered template email to a user with preference validation
   */
  async sendTemplate(options: {
    to: string;
    userId?: string;
    template: EmailTemplateType;
    data: Record<string, any>;
    isSecurityCritical?: boolean;
    preferenceKey?: string;
  }): Promise<{ queued: boolean; jobId?: string; skipped?: boolean }> {
    // 1. Check user notification preferences if not security critical
    if (options.userId && !options.isSecurityCritical) {
      try {
        const pref = await prisma.notificationPreference.findUnique({
          where: { userId: options.userId },
        });

        if (pref) {
          // Master email switch
          if (!pref.emailEnabled) {
            return { queued: false, skipped: true };
          }

          // Granular category checks
          if (options.preferenceKey && (pref as any)[options.preferenceKey] === false) {
            return { queued: false, skipped: true };
          }
        }
      } catch (err) {
        console.warn('[EMAIL SERVICE] Failed checking preference, proceeding with default enabled:', err);
      }
    }

    // 2. Render Template
    const rendered = EmailTemplateRegistry.render(options.template, options.data);

    // 3. Queue Email for background dispatch
    const jobId = await emailQueue.enqueue({
      to: options.to,
      userId: options.userId,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: options.template,
      metadata: options.data,
    });

    return { queued: true, jobId };
  }

  /**
   * Direct transactional email dispatch
   */
  async send(options: SendEmailOptions): Promise<{ success: boolean; queued: boolean; jobId: string }> {
    const jobId = await emailQueue.enqueue(options);
    return { success: true, queued: true, jobId };
  }

  /**
   * Direct transactional email alias
   */
  async sendDirect(options: SendEmailOptions) {
    return this.send(options);
  }
}

export const emailService = new EmailService();

