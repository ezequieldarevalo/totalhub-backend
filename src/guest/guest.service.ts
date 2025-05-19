import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';

@Injectable()
export class GuestService {
  constructor(private prisma: PrismaService) {}

  async createGuest(dto: CreateGuestDto) {
    const existing = await this.prisma.guest.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un huésped con ese email');
    }

    return this.prisma.guest.create({ data: dto });
  }

  async searchGuests(q: string) {
    if (!q || q.trim() === '') return [];

    return this.prisma.guest.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  async getAllGuests(
    page = 1,
    limit = 20,
    sort: 'name' | 'email' = 'name',
    order: 'asc' | 'desc' = 'asc',
  ) {
    const skip = (page - 1) * limit;

    const [guests, total] = await this.prisma.$transaction([
      this.prisma.guest.findMany({
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      this.prisma.guest.count(),
    ]);

    return {
      data: guests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGuestById(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            guests: true,
            totalPrice: true,
            paymentStatus: true,
            cancelled: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!guest) {
      throw new BadRequestException('Guest not found');
    }

    return guest;
  }

  async updateGuest(id: string, dto: CreateGuestDto) {
    const existing = await this.prisma.guest.findUnique({ where: { id } });

    if (!existing) {
      throw new BadRequestException('Guest not found');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.guest.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new BadRequestException(
          'Email is already in use by another guest',
        );
      }
    }

    return this.prisma.guest.update({
      where: { id },
      data: dto,
    });
  }

  async deleteGuest(id: string) {
    const guest = await this.prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      throw new BadRequestException('Guest not found');
    }

    const hasReservations = await this.prisma.reservation.findFirst({
      where: { guestId: id },
    });

    if (hasReservations) {
      throw new BadRequestException('Guest has associated reservations');
    }

    return this.prisma.guest.delete({ where: { id } });
  }
}
