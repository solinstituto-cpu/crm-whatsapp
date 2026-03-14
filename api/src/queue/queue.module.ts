import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { MessageProcessor } from './message.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message-queue',
    }),
  ],
  providers: [QueueService, MessageProcessor],
  exports: [QueueService],
})
export class QueueModule {}

