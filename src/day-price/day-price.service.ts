import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDayPriceDto } from './dto/create-day-price.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateDayPriceBulkDto } from './dto/create-day-price-bulk.dto';
import { parseISO, isValid, startOfDay } from 'date-fns';

@Injectable()
export class DayPriceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDayPriceDto, user: JwtPayload) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: dto.roomId,
        hostelId: user.hostelId,
      },
    });

    if (!room) {
      throw new BadRequestException('Room not found or access denied');
    }

    const normalizedDate = startOfDay(parseISO(dto.date));

    return this.prisma.dayPrice.upsert({
      where: {
        date_roomId: {
          date: normalizedDate,
          roomId: dto.roomId,
        },
      },
      update: {
        price: dto.price,
        active: true,
      },
      create: {
        roomId: dto.roomId,
        date: normalizedDate,
        price: dto.price,
        active: true,
      },
    });
  }

  async getPrices(roomId: string, from: string, to: string, user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view day prices');
    }

    if (!roomId || !from || !to) {
      throw new BadRequestException(
        'Missing query parameters: roomId, from, or to',
      );
    }

    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        hostelId: user.hostelId,
      },
    });

    if (!room) {
      throw new BadRequestException(
        'Room not found or not part of your hostel',
      );
    }

    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (!isValid(fromDate) || !isValid(toDate)) {
      throw new BadRequestException('Invalid date format');
    }

    return this.prisma.dayPrice.findMany({
      where: {
        roomId,
        date: {
          gte: startOfDay(fromDate),
          lt: startOfDay(toDate),
        },
        active: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async createBulk(dto: CreateDayPriceBulkDto, user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create bulk prices');
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

    if (!dto.prices || !Array.isArray(dto.prices)) {
      throw new BadRequestException('Missing prices');
    }

    const operations = dto.prices.map((p) => {
      const date = startOfDay(parseISO(p.date));
      if (!isValid(date)) {
        throw new BadRequestException(`Invalid date: ${p.date}`);
      }

      return this.prisma.dayPrice.upsert({
        where: {
          date_roomId: {
            date,
            roomId: dto.roomId,
          },
        },
        update: {
          price: p.price,
          active: true,
        },
        create: {
          roomId: dto.roomId,
          date,
          price: p.price,
          active: true,
        },
      });
    });

    return this.prisma.$transaction(operations);
  }

  async updateBulk(dto: CreateDayPriceBulkDto, user: JwtPayload) {
    return this.createBulk(dto, user); // reutilizamos el mismo método
  }

  async deletePrice(roomId: string, dateStr: string, user: JwtPayload) {
    const date = startOfDay(parseISO(dateStr));

    const price = await this.prisma.dayPrice.findFirst({
      where: {
        roomId,
        date,
        room: { hostelId: user.hostelId },
      },
    });

    if (!price) {
      throw new BadRequestException('Day price not found or access denied');
    }

    return this.prisma.dayPrice.update({
      where: {
        date_roomId: {
          date,
          roomId,
        },
      },
      data: {
        active: false,
      },
    });
  }

  async findByIdWithRoom(id: string) {
    return this.prisma.dayPrice.findUnique({
      where: { id },
      include: { room: true },
    });
  }
}
