import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private messageQueue: Queue;
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL'));
    
    this.messageQueue = new Queue('message-sending', {
      connection: this.redis,
    });

    this.logger.log('Queue service initialized');
  }

  async addMessageToQueue(
    to: string,
    type: string,
    data: any,
    priority: number = 0,
    delay: number = 0
  ) {
    try {
      const job = await this.messageQueue.add(
        'send-message',
        {
          to,
          type,
          data,
          isTemplate: false,
        },
        {
          priority,
          delay,
        }
      );

      this.logger.log(`Message queued for ${to}, job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue message', error);
      throw error;
    }
  }

  async addTemplateToQueue(
    to: string,
    templateName: string,
    components: any[],
    priority: number = 0,
    delay: number = 0
  ) {
    try {
      const job = await this.messageQueue.add(
        'send-template',
        {
          to,
          templateName,
          data: { components },
          isTemplate: true,
        },
        {
          priority,
          delay,
        }
      );

      this.logger.log(`Template queued for ${to}, job ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to queue template', error);
      throw error;
    }
  }

  async getQueueStatus() {
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

  async retryFailedJobs() {
    const failed = await this.messageQueue.getFailed();
    
    for (const job of failed) {
      await job.retry();
    }

    this.logger.log(`Retried ${failed.length} failed jobs`);
    return failed.length;
  }

  async clearQueue() {
    await this.messageQueue.drain();
    this.logger.log('Queue cleared');
  }

  async onModuleDestroy() {
    await this.messageQueue.close();
    await this.redis.disconnect();
  }
}