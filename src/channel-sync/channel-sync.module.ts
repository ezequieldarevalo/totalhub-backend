import { Module } from '@nestjs/common';
import { ChannelSyncService } from './channel-sync.service';
import { ChannelSyncController } from './channel-sync.controller';

@Module({
  providers: [ChannelSyncService],
  controllers: [ChannelSyncController],
})
export class ChannelSyncModule {}
