import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface MessageJob {
  type: 'message' | 'template';
  conversationId: string;
  data: any;
  sentById: string;
  retryCount?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('message-queue') private messageQueue: Queue,
  ) {}

  async addMessageJob(job: MessageJob) {
    try {
      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      };

      await this.messageQueue.add('send-message', job, jobOptions);
      this.logger.log(`Message job queued for conversation ${job.conversationId}`);
    } catch (error) {
      this.logger.error('Error queuing message job:', error);
      throw error;
    }
  }

  async addTemplateJob(job: MessageJob) {
    try {
      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      };

      await this.messageQueue.add('send-template', job, jobOptions);
      this.logger.log(`Template job queued for conversation ${job.conversationId}`);
    } catch (error) {
      this.logger.error('Error queuing template job:', error);
      throw error;
    }
  }

  async getQueueStats() {
    const waiting = await this.messageQueue.getWaiting();
    const active = await this.messageQueue.getActive();
    const completed = await this.messageQueue.getCompleted();
    const failed = await this.messageQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async clearQueue() {
    await this.messageQueue.empty();
    this.logger.log('Queue cleared');
  }
}

