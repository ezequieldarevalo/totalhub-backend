import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
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

  @Get('preview/:slug/:roomId')
  getReservationPreview(
    @Param('slug') slug: string,
    @Param('roomId') roomId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('guests', ParseIntPipe) guests: number,
    @Query('isResident') isResident?: string,
    @Query('paymentMethod') paymentMethod?: 'cash' | 'card',
    @Query('hasMuchiCard') hasMuchiCard?: string,
    @Query('muchiCardType') muchiCardType?: 'cash' | 'debit' | 'credit', // ✅ lo agregás acá
  ) {
    return this.publicService.getReservationPreview({
      slug,
      roomId,
      from,
      to,
      guests,
      isResident: isResident === 'true',
      paymentMethod: paymentMethod === 'cash' ? 'cash' : 'card',
      hasMuchiCard: hasMuchiCard === 'true',
      muchiCardType,
    });
  }
}
