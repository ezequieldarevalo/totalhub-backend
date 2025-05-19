import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class OperatorService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOperatorDto, user: JwtPayload) {
    if (!user.hostelId) {
      throw new BadRequestException('Admin must be linked to a hostel');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: dto.password, // Suponemos que se hashea en otro middleware
        role: UserRole.OPERATOR,
        hostelId: user.hostelId,
      },
    });
  }

  async findAll(user: JwtPayload) {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.OPERATOR,
        hostelId: user.hostelId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    const operator = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hostelId: true,
      },
    });

    if (
      !operator ||
      operator.role !== UserRole.OPERATOR ||
      operator.hostelId !== user.hostelId
    ) {
      throw new BadRequestException('Operator not found or access denied');
    }

    return {
      id: operator.id,
      name: operator.name,
      email: operator.email,
      role: operator.role,
    };
  }

  async updateOperator(id: string, dto: CreateOperatorDto, user: JwtPayload) {
    const operator = await this.prisma.user.findUnique({ where: { id } });

    if (
      !operator ||
      operator.role !== UserRole.OPERATOR ||
      operator.hostelId !== user.hostelId
    ) {
      throw new BadRequestException('Operator not found or access denied');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password, // suponemos que se hashea en middleware
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async remove(id: string, user: JwtPayload) {
    const operator = await this.prisma.user.findUnique({ where: { id } });

    if (
      !operator ||
      operator.role !== UserRole.OPERATOR ||
      operator.hostelId !== user.hostelId
    ) {
      throw new BadRequestException('Operator not found or access denied');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
