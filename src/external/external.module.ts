import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { ChannelReservationSyncModule } from 'src/channel-reservation-sync/channel-reservation-sync.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ChannelReservationSyncModule],
  controllers: [ExternalController],
  providers: [ExternalService, PrismaService],
})
export class ExternalModule {}
