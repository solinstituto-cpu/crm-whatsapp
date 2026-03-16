import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { MessageProcessor } from './message.processor';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-queue',
    }),
    WhatsAppModule,
  ],
  providers: [QueueService, MessageProcessor],
  exports: [QueueService],
})
export class QueueModule {}

