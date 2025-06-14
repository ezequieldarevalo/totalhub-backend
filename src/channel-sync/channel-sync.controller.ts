import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ChannelSyncService } from './channel-sync.service';

@Controller('channel-sync')
export class ChannelSyncController {
  constructor(private readonly channelSyncService: ChannelSyncService) {}

  @Get('logs')
  async getSyncLogs(@Query('hostelId') hostelId: string) {
    if (!hostelId) {
      throw new BadRequestException('Missing hostelId');
    }

    return this.channelSyncService.getSyncLogsByHostel(hostelId);
  }
}
