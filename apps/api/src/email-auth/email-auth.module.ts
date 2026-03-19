import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailAuthController } from './email-auth.controller';
import { EmailAuthService } from './email-auth.service';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [EmailAuthController],
  providers: [EmailAuthService],
  exports: [EmailAuthService],
})
export class EmailAuthModule {}

