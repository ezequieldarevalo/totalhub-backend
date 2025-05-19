import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicCreateReservationDto } from './dto/public-create-reservation.dto';

@Controller('public/hostels')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':slug/rooms')
  getRooms(@Param('slug') slug: string) {
    return this.publicService.getRoomsBySlug(slug);
  }

  @Get()
  getHostels() {
    return this.publicService.getAllHostels();
  }

  @Get(':slug/rooms/:roomSlug')
  getRoom(@Param('slug') slug: string, @Param('roomSlug') roomSlug: string) {
    return this.publicService.getRoomBySlug(slug, roomSlug);
  }

  @Get(':slug/availability')
  getAvailability(
    @Param('slug') slug: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.publicService.getAvailabilityBySlug(slug, from, to);
  }

  @Post(':slug/reservations')
  createReservation(
    @Param('slug') slug: string,
    @Body() dto: PublicCreateReservationDto,
  ) {
    return this.publicService.createReservation(slug, dto);
  }

  @Get('reservations/lookup')
  lookupReservation(@Query('email') email: string) {
    return this.publicService.lookupReservationsByEmail(email);
  }
}
