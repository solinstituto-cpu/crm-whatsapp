import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MessageService } from '../whatsapp/message.service';

@Processor('message-queue')
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(private readonly messageService: MessageService) {}

  @Process('send-message')
  async handleMessage(job: Job) {
    this.logger.log(`Processing message job ${job.id}`);
    
    try {
      const { conversationId, data, sentById } = job.data;
      
      await this.messageService.sendMessage(conversationId, data, sentById);
      
      this.logger.log(`Message job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Message job ${job.id} failed:`, error);
      throw error;
    }
  }

  @Process('send-template')
  async handleTemplate(job: Job) {
    this.logger.log(`Processing template job ${job.id}`);
    
    try {
      const { conversationId, data, sentById } = job.data;
      
      await this.messageService.sendTemplate(conversationId, data, sentById);
      
      this.logger.log(`Template job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Template job ${job.id} failed:`, error);
      throw error;
    }
  }
}

