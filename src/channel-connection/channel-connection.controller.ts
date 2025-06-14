import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChannelConnectionService } from './channel-connection.service';
import { CreateChannelConnectionDto } from './dto/create-channel-connection.dto';

@Controller('channel-connections')
export class ChannelConnectionController {
  constructor(private readonly service: ChannelConnectionService) {}

  @Post()
  create(@Body() dto: CreateChannelConnectionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-hostel/:hostelId')
  findByHostel(@Param('hostelId') hostelId: string) {
    return this.service.findByHostel(hostelId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
