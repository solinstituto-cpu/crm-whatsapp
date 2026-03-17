import { Module, forwardRef } from '@nestjs/common';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';
import { FlowEngineService } from './flow-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowEngineService],
  exports: [FlowsService, FlowEngineService],
})
export class FlowsModule {}
