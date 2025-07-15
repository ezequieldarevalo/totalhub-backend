// src/day-price/day-price.controller.ts
import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Req,
  UseGuards,
  Delete,
  Param,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DayPriceService } from './day-price.service';
import { CreateDayPriceDto } from './dto/create-day-price.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BulkDayPriceDto } from './dto/bulk-day-price.dto';

@Controller('day-prices')
export class DayPriceController {
  constructor(private readonly dayPriceService: DayPriceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateDayPriceDto, @Req() req: { user: JwtPayload }) {
    return this.dayPriceService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('bulk')
  createBulk(@Body() dto: BulkDayPriceDto, @Req() req: { user: JwtPayload }) {
    return this.dayPriceService.createBulk(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  getPrices(
    @Query('roomId') roomId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.dayPriceService.getPrices(roomId, from, to, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':roomId/:date')
  deletePrice(
    @Param('roomId') roomId: string,
    @Param('date') date: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.dayPriceService.deletePrice(roomId, date, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('range')
  getRange(
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: { user: JwtPayload },
  ) {
    return this.dayPriceService.getRangeForHostel(req.user.hostelId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('check-conflicts')
  async checkConflicts(
    @Body() body: { roomIds: string[]; from: string; to: string },
  ) {
    const { roomIds, from, to } = body;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (
      !fromDate ||
      !toDate ||
      isNaN(fromDate.getTime()) ||
      isNaN(toDate.getTime())
    ) {
      throw new BadRequestException('Fechas inválidas');
    }

    const hasConflicts = await this.dayPriceService.hasConflicts(
      roomIds,
      fromDate,
      toDate,
    );

    return { hasConflicts };
  }

  @Patch(':id')
  updateDayPrice(
    @Param('id') id: string,
    @Body() body: { price?: number; availableCapacity?: number },
  ) {
    return this.dayPriceService.update(id, body);
  }
}
