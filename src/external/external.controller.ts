import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ExternalService } from './external.service';
import { BookingReservationDto } from './dto/booking-reservation.dto';

@Controller('external/booking')
export class ExternalController {
  constructor(private readonly externalService: ExternalService) {}

  @Post('reservations')
  async receiveReservation(@Body() payload: BookingReservationDto) {
    return this.externalService.processBookingReservation(payload);
  }

  @Get('synced')
  async getSyncedReservations(
    @Query('hostelId') hostelId?: string,
    @Query('externalResId') externalResId?: string,
  ) {
    return this.externalService.getSyncedReservations(hostelId, externalResId);
  }

  @Get('availability')
  async getAvailability(
    @Query('connectionId') connectionId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!connectionId || !from || !to) {
      throw new BadRequestException('Missing required query params');
    }

    const connection =
      await this.externalService.getConnectionById(connectionId);
    if (!connection) {
      throw new BadRequestException('Invalid connectionId');
    }

    return this.externalService.getAvailability(connection.hostelId, from, to);
  }

  @Get('prices')
  async getPrices(
    @Query('hostelId') hostelId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!hostelId || !from || !to) {
      throw new BadRequestException('Missing required query parameters');
    }

    return this.externalService.getPrices(hostelId, from, to);
  }

  @Post('map-room')
  async mapRoom(@Body() body: { roomId: string; externalRoomId: string }) {
    if (!body.roomId || !body.externalRoomId) {
      throw new BadRequestException('roomId and externalRoomId are required');
    }

    return this.externalService.assignExternalRoomId(
      body.roomId,
      body.externalRoomId,
    );
  }
}
