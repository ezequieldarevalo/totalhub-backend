import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERATOR')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @Req() req: { user: JwtPayload }) {
    return this.reservationsService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  @Post(':id/payments')
  addPayment(
    @Param('id') reservationId: string,
    @Body('amount') amount: number,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.addPayment(reservationId, amount, req.user);
  }

  @Get()
  getReservations(
    @Query('roomId') roomId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getReservations(roomId, from, to, req.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.reservationsService.deleteReservation(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.updateReservation(id, dto, req.user);
  }

  @Get('calendar')
  getCalendar(
    @Query('roomId') roomId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getCalendar(roomId, from, to, req.user);
  }

  @Get('dashboard')
  getReservationsForDashboard(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('includeCancelled') includeCancelled: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getReservationsForHostel(
      req.user.hostelId,
      from,
      to,
      includeCancelled === 'true',
    );
  }

  @Get('upcoming')
  getUpcoming(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('includeCancelled') includeCancelled: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getUpcomingReservations(
      req.user,
      from,
      to,
      includeCancelled === 'true',
    );
  }

  @Get('calendar/hostel')
  getHostelCalendar(
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getHostelCalendar(from, to, req.user);
  }

  @Get(':id/preview-update')
  previewUpdate(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('guests') guests: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.previewUpdateReservation(
      id,
      startDate,
      endDate,
      parseInt(guests, 10),
      req.user,
    );
  }

  @Get('preview')
  previewCreate(
    @Query('roomId') roomId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('guests') guests: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.previewCreateReservation(
      roomId,
      startDate,
      endDate,
      parseInt(guests, 10),
      req.user,
    );
  }

  @Get('history')
  getReservationsHistory(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('includeCancelled') includeCancelled: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getReservationsHistory(
      req.user,
      from,
      to,
      includeCancelled === 'true',
    );
  }

  @Get('occupancy')
  getOccupancyReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getOccupancyReport(from, to, req.user);
  }

  @Get('income')
  getIncomeReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getIncomeReport(from, to, req.user);
  }

  @Get(':id')
  getReservationById(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.reservationsService.getReservationById(id, req.user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.reservationsService.cancelReservation(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/payments')
  async getPayments(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.reservationsService.getPaymentsForReservation(id, req.user);
  }
}
