import { Module } from '@nestjs/common';
import { WhatsAppAccountsService } from './whatsapp-accounts.service';
import { WhatsAppAccountsController } from './whatsapp-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsAppAccountsController],
  providers: [WhatsAppAccountsService],
  exports: [WhatsAppAccountsService],
})
export class WhatsAppAccountsModule {}
