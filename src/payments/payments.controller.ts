import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('reservation/:id')
  async getPaymentsForReservation(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.paymentsService.getPaymentsForReservation(id, req.user);
  }

  @Post(':reservationId')
  async addPayment(
    @Param('reservationId') reservationId: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.paymentsService.addPayment(reservationId, dto.amount, req.user);
  }
}
