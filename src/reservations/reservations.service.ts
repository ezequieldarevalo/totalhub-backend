import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import {
  parseISO,
  addDays,
  eachDayOfInterval,
  isValid,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Prisma } from '@prisma/client';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReservationDto, user: JwtPayload) {
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      throw new BadRequestException('Unauthorized to create reservations');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: dto.roomId,
        hostelId: user.hostelId,
      },
    });

    if (!room) {
      throw new BadRequestException(
        'Room not found or not part of your hostel',
      );
    }

    const startDate = parseISO(dto.startDate);
    const endDate = parseISO(dto.endDate);

    if (!isValid(startDate) || !isValid(endDate) || endDate <= startDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(endDate, -1),
    });

    const prices = await this.prisma.dayPrice.findMany({
      where: {
        roomId: dto.roomId,
        date: { gte: startDate, lt: endDate },
      },
    });

    if (prices.length !== days.length) {
      throw new BadRequestException(
        'Missing prices for some days in the selected range',
      );
    }

    for (const day of days) {
      const sameDayReservations = await this.prisma.reservation.findMany({
        where: {
          roomId: dto.roomId,
          startDate: { lte: day },
          endDate: { gt: day },
          cancelled: false,
        },
      });

      const totalGuests = sameDayReservations.reduce(
        (acc, r) => acc + r.guests,
        0,
      );

      if (totalGuests + dto.guests > room.capacity) {
        throw new BadRequestException(
          `No availability for date ${day.toISOString().split('T')[0]}`,
        );
      }
    }

    const total = prices.reduce((sum, p) => sum + p.price * dto.guests, 0);
    const amountPaid = dto.amountPaid ?? 0;

    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (amountPaid === 0) paymentStatus = 'pending';
    else if (amountPaid < total) paymentStatus = 'partial';
    else paymentStatus = 'paid';

    let guestId: string | null = null;

    if (dto.email) {
      let guest = await this.prisma.guest.findUnique({
        where: { email: dto.email },
      });

      if (!guest && dto.name) {
        guest = await this.prisma.guest.create({
          data: {
            email: dto.email,
            name: dto.name,
          },
        });
      }

      guestId = guest?.id ?? null;
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        roomId: dto.roomId,
        startDate,
        endDate,
        guests: dto.guests,
        cancelled: false,
        name: dto.name || null,
        email: dto.email || null,
        amountPaid,
        paymentStatus,
        totalPrice: total,
        guestId,
      },
    });

    return { reservation, total };
  }

  async addPayment(reservationId: string, amount: number, user: JwtPayload) {
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      throw new BadRequestException('Unauthorized');
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    if (amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    await this.prisma.reservationPayment.create({
      data: {
        reservationId,
        amount,
      },
    });

    return { message: 'Payment added successfully' };
  }

  async getReservations(
    roomId: string,
    from: string,
    to: string,
    user: JwtPayload,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      throw new BadRequestException('Not authorized to view reservations');
    }

    const filters: Prisma.ReservationWhereInput = {
      room: { hostelId: user.hostelId },
      cancelled: false,
    };

    if (roomId) filters.roomId = roomId;

    if (from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      if (!isValid(fromDate) || !isValid(toDate)) {
        throw new BadRequestException('Invalid date range');
      }
      filters.OR = [
        { startDate: { gte: fromDate, lt: toDate } },
        { endDate: { gt: fromDate, lte: toDate } },
      ];
    }

    const reservations = await this.prisma.reservation.findMany({
      where: filters,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guests: true,
        cancelled: true,
        name: true,
        email: true,
        totalPrice: true,
        paymentStatus: true,
        room: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return reservations.map((r) => ReservationResponseDto.fromEntity(r));
  }

  async deleteReservation(id: string, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    return this.prisma.reservation.delete({ where: { id } });
  }

  async updateReservation(
    id: string,
    dto: UpdateReservationDto,
    user: JwtPayload,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: {
          select: { hostelId: true },
        },
      },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    let guestId: string | null = reservation.guestId || null;

    if (dto.email) {
      let guest = await this.prisma.guest.findUnique({
        where: { email: dto.email },
      });

      if (!guest && dto.name) {
        guest = await this.prisma.guest.create({
          data: {
            email: dto.email,
            name: dto.name,
          },
        });
      }

      guestId = guest?.id ?? null;
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        guests: dto.guests,
        name: dto.name ?? null,
        email: dto.email ?? null,
        guestId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ReservationResponseDto.fromEntity(updated);
  }

  async getCalendar(
    roomId: string,
    from: string,
    to: string,
    user: JwtPayload,
  ) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, hostelId: user.hostelId },
    });

    if (!room) {
      throw new BadRequestException('Room not found or access denied');
    }

    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate)) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        roomId,
        cancelled: false,
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
    });

    const calendar = days.map((day) => {
      const guestsThatDay = reservations
        .filter((r) => r.startDate <= day && r.endDate > day)
        .reduce((sum, r) => sum + r.guests, 0);

      return {
        date: day.toISOString().split('T')[0],
        guests: guestsThatDay,
        available: guestsThatDay < room.capacity,
        capacity: room.capacity,
      };
    });

    return { roomId, calendar };
  }

  async getReservationsForHostel(
    hostelId: string,
    from?: string,
    to?: string,
    includeCancelled = false,
  ) {
    const where: Prisma.ReservationWhereInput = {
      room: { hostelId },
      ...(includeCancelled ? {} : { cancelled: false }),
    };

    if (from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      if (isValid(fromDate) && isValid(toDate)) {
        where.OR = [
          { startDate: { gte: fromDate, lt: toDate } },
          { endDate: { gt: fromDate, lte: toDate } },
        ];
      }
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guests: true,
        cancelled: true,
        name: true,
        email: true,
        totalPrice: true,
        paymentStatus: true,
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return reservations.map((r) => ReservationResponseDto.fromEntity(r));
  }

  async getUpcomingReservations(
    user: JwtPayload,
    from?: string,
    to?: string,
    includeCancelled = false,
  ) {
    const where: Prisma.ReservationWhereInput = {
      room: { hostelId: user.hostelId },
      ...(includeCancelled ? {} : { cancelled: false }),
      endDate: { gte: new Date() },
    };

    if (from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      if (isValid(fromDate) && isValid(toDate)) {
        where.OR = [
          { startDate: { gte: fromDate, lt: toDate } },
          { endDate: { gt: fromDate, lte: toDate } },
        ];
      }
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guests: true,
        cancelled: true,
        name: true,
        email: true,
        totalPrice: true,
        paymentStatus: true,
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return reservations.map((r) => ReservationResponseDto.fromEntity(r));
  }

  async getHostelCalendar(from: string, to: string, user: JwtPayload) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const rooms = await this.prisma.room.findMany({
      where: { hostelId: user.hostelId },
      select: { id: true, name: true, capacity: true },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        cancelled: false,
        room: { hostelId: user.hostelId },
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
    });

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      availability: days.map((day) => {
        const guests = reservations
          .filter(
            (r) =>
              r.roomId === room.id && r.startDate <= day && r.endDate > day,
          )
          .reduce((sum, r) => sum + r.guests, 0);

        return { date: day.toISOString().split('T')[0], guests };
      }),
    }));
  }

  async previewUpdateReservation(
    id: string,
    startDateStr: string,
    endDateStr: string,
    guests: number,
    user: JwtPayload,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    if (!isValid(startDate) || !isValid(endDate)) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(endDate, -1),
    });

    const prices = await this.prisma.dayPrice.findMany({
      where: {
        roomId: reservation.roomId,
        date: { gte: startDate, lt: endDate },
      },
    });

    if (prices.length !== days.length) {
      return { valid: false, message: 'Missing prices for some days' };
    }

    const breakdown = days.map((day) => {
      const price = prices.find((p) =>
        isSameDay(startOfDay(p.date), startOfDay(day)),
      );
      return {
        date: day.toISOString().split('T')[0],
        price: price?.price || 0,
      };
    });

    const total = breakdown.reduce((acc, b) => acc + b.price * guests, 0);

    return { valid: true, total, breakdown };
  }

  async previewCreateReservation(
    roomId: string,
    startDateStr: string,
    endDateStr: string,
    guests: number,
    user: JwtPayload,
  ) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, hostelId: user.hostelId },
    });

    if (!room) {
      throw new BadRequestException('Room not found or access denied');
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(endDate, -1),
    });

    const prices = await this.prisma.dayPrice.findMany({
      where: {
        roomId,
        date: { gte: startDate, lt: endDate },
      },
    });

    if (prices.length !== days.length) {
      return { valid: false, message: 'Missing prices for some days' };
    }

    const breakdown = days.map((day) => {
      const price = prices.find((p) =>
        isSameDay(startOfDay(p.date), startOfDay(day)),
      );
      return {
        date: day.toISOString().split('T')[0],
        price: price?.price || 0,
      };
    });

    const total = breakdown.reduce((acc, b) => acc + b.price * guests, 0);

    return { valid: true, total, breakdown };
  }

  async getReservationById(id: string, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, name: true, hostelId: true } },
        guest: { select: { id: true, name: true, email: true } },
        payments: { select: { amount: true } },
      },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    return ReservationResponseDto.fromEntity(reservation);
  }

  async cancelReservation(id: string, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: { select: { hostelId: true } },
      },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { cancelled: true },
    });
  }

  async getReservationsHistory(
    user: JwtPayload,
    from?: string,
    to?: string,
    includeCancelled = false,
  ) {
    const today = new Date();

    const where: Prisma.ReservationWhereInput = {
      room: { hostelId: user.hostelId },
      endDate: { lt: today },
      ...(includeCancelled ? {} : { cancelled: false }),
    };

    if (from && to) {
      const fromDate = parseISO(from);
      const toDate = parseISO(to);
      if (isValid(fromDate) && isValid(toDate)) {
        where.OR = [
          { startDate: { gte: fromDate, lt: toDate } },
          { endDate: { gt: fromDate, lte: toDate } },
        ];
      }
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guests: true,
        cancelled: true,
        name: true,
        email: true,
        totalPrice: true,
        paymentStatus: true,
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return reservations.map((r) => ReservationResponseDto.fromEntity(r));
  }

  async getIncomeReport(from: string, to: string, user: JwtPayload) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate) || fromDate >= toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        cancelled: false,
        room: { hostelId: user.hostelId },
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
        guests: true,
      },
    });

    const dayPrices = await this.prisma.dayPrice.findMany({
      where: {
        date: {
          gte: fromDate,
          lt: toDate,
        },
        room: { hostelId: user.hostelId },
        active: true,
      },
    });

    const priceMap = new Map<string, number>();
    for (const price of dayPrices) {
      priceMap.set(
        `${price.roomId}_${price.date.toISOString().split('T')[0]}`,
        price.price,
      );
    }

    const incomeByDay: { [key: string]: number } = {};

    for (const day of days) {
      const dateStr = day.toISOString().split('T')[0];
      incomeByDay[dateStr] = 0;

      for (const reservation of reservations) {
        if (reservation.startDate <= day && reservation.endDate > day) {
          const priceKey = `${reservation.roomId}_${dateStr}`;
          const price = priceMap.get(priceKey) || 0;
          incomeByDay[dateStr] += price * reservation.guests;
        }
      }
    }

    return days.map((day) => ({
      date: day.toISOString().split('T')[0],
      totalIncome: incomeByDay[day.toISOString().split('T')[0]] || 0,
    }));
  }

  async getOccupancyReport(from: string, to: string, user: JwtPayload) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate) || fromDate >= toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const days = eachDayOfInterval({
      start: fromDate,
      end: addDays(toDate, -1),
    });

    const rooms = await this.prisma.room.findMany({
      where: { hostelId: user.hostelId },
      select: { id: true },
    });

    const reservations = await this.prisma.reservation.findMany({
      where: {
        cancelled: false,
        room: { hostelId: user.hostelId },
        startDate: { lt: toDate },
        endDate: { gt: fromDate },
      },
      select: {
        roomId: true,
        startDate: true,
        endDate: true,
      },
    });

    const report = days.map((day) => {
      const occupiedRoomIds = new Set<string>();

      for (const reservation of reservations) {
        if (reservation.startDate <= day && reservation.endDate > day) {
          occupiedRoomIds.add(reservation.roomId);
        }
      }

      const occupied = occupiedRoomIds.size;
      const total = rooms.length;
      const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

      return {
        date: day.toISOString().split('T')[0],
        occupiedRooms: occupied,
        totalRooms: total,
        occupancyPercentage: percentage,
      };
    });

    return report;
  }

  async getPaymentsForReservation(id: string, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: {
          select: { hostelId: true },
        },
      },
    });

    if (!reservation || reservation.room.hostelId !== user.hostelId) {
      throw new BadRequestException('Reservation not found or access denied');
    }

    return this.prisma.reservationPayment.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
