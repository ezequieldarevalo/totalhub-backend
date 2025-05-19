import { Module } from '@nestjs/common';
import { DayPriceService } from './day-price.service';
import { DayPriceController } from './day-price.controller';

@Module({
  controllers: [DayPriceController],
  providers: [DayPriceService],
})
export class DayPriceModule {}
