import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.channelService.create(dto);
  }

  @Get()
  findAll() {
    return this.channelService.findAll();
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.channelService.findByCode(code);
  }
}
