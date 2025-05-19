// src/day-price/dto/create-day-price-bulk.dto.ts
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, Min } from 'class-validator';

class PricePerDayDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateDayPriceBulkDto {
  @IsUUID()
  roomId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricePerDayDto)
  prices: PricePerDayDto[];
}
