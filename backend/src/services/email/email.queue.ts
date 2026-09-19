import { EmailQueueJob, SendEmailOptions } from './email.types.js';
import { EmailProviderFactory } from './email.provider.js';
import { prisma } from '../../config/database.js';

export class EmailQueue {
  private queue: EmailQueueJob[] = [];
  private isProcessing = false;
  private maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10);

  /**
   * Push an email job onto the async queue
   */
  async enqueue(options: SendEmailOptions): Promise<string> {
    const { providerType } = EmailProviderFactory.getProvider();
    
    // Create initial EmailLog record
    let logId: string | undefined;
    try {
      const log = await prisma.emailLog.create({
        data: {
          userId: options.userId || null,
          recipient: options.to,
          subject: options.subject,
          template: (options.template as string) || 'GENERIC',
          status: 'QUEUED',
          provider: providerType,
          attempts: 0,
        },
      });
      logId = log.id;
    } catch (err) {
      console.warn('[EMAIL QUEUE] Could not persist EmailLog record:', err);
    }

    const job: EmailQueueJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      logId,
      userId: options.userId,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      template: options.template || 'GENERIC',
      attempts: 0,
      maxAttempts: this.maxRetries,
      metadata: options.metadata,
    };

    this.queue.push(job);
    this.processQueue();

    return job.id;
  }

  /**
   * Process all queued email jobs with retry handling
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      job.attempts += 1;
      job.lastAttemptAt = new Date();

      const { provider } = EmailProviderFactory.getProvider();

      // Update log to SENDING
      if (job.logId) {
        try {
          await prisma.emailLog.update({
            where: { id: job.logId },
            data: { status: 'SENDING', attempts: job.attempts },
          });
        } catch (_) {}
      }

      try {
        const result = await provider.send({
          to: job.to,
          subject: job.subject,
          html: job.html,
          text: job.text,
          userId: job.userId,
          template: job.template,
        });

        if (result.success) {
          // Mark as SENT in database
          if (job.logId) {
            try {
              await prisma.emailLog.update({
                where: { id: job.logId },
                data: {
                  status: 'SENT',
                  providerMessageId: result.messageId,
                  sentAt: new Date(),
                  attempts: job.attempts,
                },
              });
            } catch (_) {}
          }
        } else {
          throw new Error(result.error || 'Unknown email provider failure');
        }
      } catch (err: any) {
        console.error(`[EMAIL QUEUE ERROR] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, err.message);

        if (job.attempts < job.maxAttempts) {
          // Retry with exponential backoff
          if (job.logId) {
            try {
              await prisma.emailLog.update({
                where: { id: job.logId },
                data: { status: 'RETRYING', errorMessage: err.message, attempts: job.attempts },
              });
            } catch (_) {}
          }
          setTimeout(() => {
            this.queue.push(job);
            this.processQueue();
          }, Math.min(1000 * Math.pow(2, job.attempts), 10000));
        } else {
          // Permanently failed
          if (job.logId) {
            try {
              await prisma.emailLog.update({
                where: { id: job.logId },
                data: { status: 'FAILED', errorMessage: err.message, attempts: job.attempts },
              });
            } catch (_) {}
          }
        }
      }
    }

    this.isProcessing = false;
  }
}

export const emailQueue = new EmailQueue();
