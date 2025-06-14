import { Module } from '@nestjs/common';
import { ChannelReservationSyncService } from './channel-reservation-sync.service';
import { ChannelReservationSyncController } from './channel-reservation-sync.controller';

@Module({
  providers: [ChannelReservationSyncService],
  controllers: [ChannelReservationSyncController]
})
export class ChannelReservationSyncModule {}
