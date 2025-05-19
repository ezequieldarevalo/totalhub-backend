import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentsForReservation(reservationId: string, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reserva no encontrada o acceso denegado');
    }

    return this.prisma.reservationPayment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPayment(reservationId: string, amount: number, user: JwtPayload) {
    if (amount <= 0) {
      throw new BadRequestException('Monto inválido');
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true, payments: true },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reserva no encontrada o acceso denegado');
    }

    const newPayment = await this.prisma.reservationPayment.create({
      data: {
        reservationId,
        amount,
      },
    });

    const totalPaid =
      reservation.payments.reduce((sum, p) => sum + p.amount, 0) + amount;

    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (totalPaid === 0) paymentStatus = 'pending';
    else if (totalPaid < reservation.totalPrice) paymentStatus = 'partial';
    else paymentStatus = 'paid';

    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { paymentStatus },
    });

    return newPayment;
  }
}
