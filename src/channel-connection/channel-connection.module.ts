import { Module } from '@nestjs/common';
import { ChannelConnectionService } from './channel-connection.service';
import { ChannelConnectionController } from './channel-connection.controller';

@Module({
  providers: [ChannelConnectionService],
  controllers: [ChannelConnectionController]
})
export class ChannelConnectionModule {}
