// src/public/public.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public-availability')
export class PublicAvailabilityController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  async getAllAvailability(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('guests') guests: string,
  ) {
    if (!from || !to || !guests) {
      throw new BadRequestException('Faltan parámetros');
    }

    return this.publicService.getAllAvailability(
      from,
      to,
      parseInt(guests, 10),
    );
  }
}
