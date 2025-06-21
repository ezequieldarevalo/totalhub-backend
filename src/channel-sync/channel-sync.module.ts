import { Module } from '@nestjs/common';
import { ChannelSyncService } from './channel-sync.service';
import { ChannelSyncController } from './channel-sync.controller';
import { ReservationsModule } from 'src/reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  providers: [ChannelSyncService],
  controllers: [ChannelSyncController],
})
export class ChannelSyncModule {}
