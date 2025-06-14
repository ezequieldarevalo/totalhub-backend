import { UserRole } from '@prisma/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
        hostel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateAdminUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('Email ya en uso');
    }

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password, // se asume hash
        role: UserRole.ADMIN,
        hostelId: dto.hostelId,
      },
    });
  }

  async findById(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hostelId: true,
        hostel: { select: { name: true } },
      },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new BadRequestException('Admin no encontrado');
    }

    return admin;
  }

  async update(id: string, dto: CreateAdminUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        hostelId: dto.hostelId,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
