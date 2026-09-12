import { Module } from '@nestjs/common';
import { SocialAccountsService } from './social-accounts.service';
import { SocialAccountsController } from './social-accounts.controller';

@Module({
  providers: [SocialAccountsService],
  controllers: [SocialAccountsController],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule {}
