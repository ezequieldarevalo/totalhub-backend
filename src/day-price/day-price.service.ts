import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDayPriceDto } from './dto/create-day-price.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BulkDayPriceDto } from './dto/bulk-day-price.dto';
import { parseISO, isValid, startOfDay, eachDayOfInterval } from 'date-fns';
import { Prisma } from '@prisma/client';

type NewDayPriceInput = {
  roomId: string;
  date: Date;
  price: number;
  availableCapacity?: number | null;
};

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
        availableCapacity: dto.availableCapacity ?? null,
        active: true,
      },
      create: {
        roomId: dto.roomId,
        date: normalizedDate,
        price: dto.price,
        availableCapacity: dto.availableCapacity ?? null,
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

  async bulkUpsert(dto: BulkDayPriceDto) {
    const { roomIds, from, to, price, availableCapacity, overwrite } = dto;

    const dates = eachDayOfInterval({
      start: startOfDay(parseISO(from)),
      end: startOfDay(parseISO(to)),
    });

    const operations: Prisma.PrismaPromise<any>[] = [];

    for (const roomId of roomIds) {
      for (const date of dates) {
        if (overwrite) {
          operations.push(
            this.prisma.dayPrice.upsert({
              where: {
                date_roomId: {
                  date,
                  roomId,
                },
              },
              update: {
                price: price ?? 0,
                availableCapacity: availableCapacity ?? 0,
                active: true,
              },
              create: {
                roomId,
                date,
                price: price ?? 0,
                availableCapacity: availableCapacity ?? 0,
                active: true,
              },
            }),
          );
        } else {
          operations.push(
            this.prisma.dayPrice.createMany({
              data: [
                {
                  roomId,
                  date,
                  price: price ?? 0,
                  availableCapacity: availableCapacity ?? 0,
                  active: true,
                },
              ],
              skipDuplicates: true,
            }),
          );
        }
      }
    }

    return this.prisma.$transaction(operations);
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

  async getRangeForHostel(hostelId: string, from: string, to: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        hostelId,
      },
      select: {
        id: true,
        roomType: {
          select: {
            name: true,
            capacity: true,
          },
        },
      },
    });

    const dayPrices = await this.prisma.dayPrice.findMany({
      where: {
        room: {
          hostelId,
        },
        date: {
          gte: startOfDay(parseISO(from)),
          lte: startOfDay(parseISO(to)),
        },
        active: true,
      },
    });

    const dates = eachDayOfInterval({
      start: startOfDay(parseISO(from)),
      end: startOfDay(parseISO(to)),
    }).map((d) => d.toISOString().split('T')[0]);

    return rooms.map((room) => {
      const pricesForRoom = dayPrices.filter((p) => p.roomId === room.id);
      const prices = dates.map((date) => {
        const record = pricesForRoom.find(
          (p) => p.date.toISOString().split('T')[0] === date,
        );
        return {
          id: record?.id ?? null, // 👈 añadís esto
          date,
          price: record?.price ?? null,
          availableCapacity: record?.availableCapacity ?? null,
        };
      });

      return {
        room,
        prices,
      };
    });
  }

  async findByIdWithRoom(id: string) {
    return this.prisma.dayPrice.findUnique({
      where: { id },
      include: { room: true },
    });
  }

  async hasConflicts(
    roomIds: string[],
    from: Date,
    to: Date,
  ): Promise<boolean> {
    const conflict = await this.prisma.dayPrice.findFirst({
      where: {
        roomId: { in: roomIds },
        date: {
          gte: from,
          lte: to,
        },
      },
    });

    return !!conflict;
  }

  async createBulk(dto: BulkDayPriceDto, user: JwtPayload) {
    const { roomIds, from, to, price, availableCapacity, overwrite } = dto;
    const hostelId = user.hostelId;
    if (!hostelId) throw new ForbiddenException('No hostel ID associated');

    const fromDate = startOfDay(parseISO(from));
    const toDate = startOfDay(parseISO(to));
    if (!isValid(fromDate) || !isValid(toDate) || fromDate > toDate) {
      throw new BadRequestException(
        'Fechas inválidas. Asegurate que "desde" sea anterior a "hasta"',
      );
    }

    const dates = eachDayOfInterval({ start: fromDate, end: toDate });

    const existing = await this.prisma.dayPrice.findMany({
      where: {
        roomId: { in: roomIds },
        date: { in: dates },
      },
    });

    const newEntries: NewDayPriceInput[] = [];

    for (const roomId of roomIds) {
      for (const date of dates) {
        const exists = existing.find(
          (e) => e.roomId === roomId && e.date.getTime() === date.getTime(),
        );
        if (!exists || overwrite) {
          newEntries.push({
            roomId,
            date,
            price: price!,
            availableCapacity: availableCapacity ?? null,
          });
        }
      }
    }

    if (!newEntries.length) {
      return { message: 'No se generaron precios nuevos.' };
    }

    for (const entry of newEntries) {
      const existing = await this.prisma.dayPrice.findFirst({
        where: {
          roomId: entry.roomId,
          date: entry.date,
        },
      });

      if (existing) {
        await this.prisma.dayPrice.update({
          where: { id: existing.id },
          data: {
            price: entry.price,
            availableCapacity: entry.availableCapacity,
          },
        });
      } else {
        await this.prisma.dayPrice.create({
          data: {
            roomId: entry.roomId,
            date: entry.date,
            price: entry.price,
            availableCapacity: entry.availableCapacity,
            active: true,
          },
        });
      }
    }

    return { message: `Se generaron ${newEntries.length} precios.` };
  }

  async update(
    id: string,
    data: { price?: number; availableCapacity?: number },
  ) {
    return this.prisma.dayPrice.update({
      where: { id },
      data: {
        ...(data.price !== undefined && { price: data.price }),
        ...(data.availableCapacity !== undefined && {
          availableCapacity: data.availableCapacity,
        }),
      },
    });
  }
}
