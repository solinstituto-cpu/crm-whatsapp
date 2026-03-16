import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}

