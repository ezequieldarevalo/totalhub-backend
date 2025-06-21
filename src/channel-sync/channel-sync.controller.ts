// src/channel-sync/channel-sync.controller.ts
import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { ChannelSyncService } from './channel-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('channel-sync')
export class ChannelSyncController {
  constructor(private readonly channelSyncService: ChannelSyncService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  @Get('logs')
  async getSyncLogs(
    @Query('hostelId') hostelId: string,
    @Query('status') status?: string,
    @Query('externalResId') externalResId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (!hostelId) {
      throw new BadRequestException('Missing hostelId');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.channelSyncService.getSyncLogsByHostel(
      hostelId,
      { status, externalResId },
      pageNum,
      limitNum,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('confirmed')
  getConfirmed(@Query('hostelId') hostelId: string) {
    if (!hostelId) throw new BadRequestException('Missing hostelId');
    return this.channelSyncService.getConfirmedReservations(hostelId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/retry')
  async retrySync(@Param('id') id: string) {
    return await this.channelSyncService.retrySync(id);
  }
}
