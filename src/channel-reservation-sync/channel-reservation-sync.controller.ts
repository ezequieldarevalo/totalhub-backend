import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelReservationSyncService } from './channel-reservation-sync.service';
import { CreateChannelReservationSyncDto } from './dto/create-channel-reservation-sync.dto';

@Controller('channel-reservation-sync')
export class ChannelReservationSyncController {
  constructor(private readonly service: ChannelReservationSyncService) {}

  @Post()
  create(@Body() dto: CreateChannelReservationSyncDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-external/:externalResId')
  findByExternalId(@Param('externalResId') externalResId: string) {
    return this.service.findByExternalId(externalResId);
  }
}
