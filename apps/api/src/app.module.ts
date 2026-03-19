import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationsModule } from './conversations/conversations.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { WhatsAppAccountsModule } from './whatsapp-accounts/whatsapp-accounts.module';
import { TemplatesModule } from './templates/templates.module';
import { RulesModule } from './rules/rules.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { QueueModule } from './queue/queue.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { FlowsModule } from './flows/flows.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { QuickRepliesModule } from './quick-replies/quick-replies.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { EmailCampaignsModule } from './email-campaigns/email-campaigns.module';
import { EmailAuthModule } from './email-auth/email-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // max 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    ConversationsModule,
    WhatsAppModule,
    WhatsAppAccountsModule,
    TemplatesModule,
    RulesModule,
    PipelineModule,
    QueueModule,
    ReportsModule,
    SettingsModule,
    FlowsModule,
    CampaignsModule,
    QuickRepliesModule,
    KnowledgeModule,
    EmailCampaignsModule,
    EmailAuthModule,
  ],
})
export class AppModule {}