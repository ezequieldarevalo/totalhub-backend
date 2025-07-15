import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class SingleDayPriceDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableCapacity?: number;
}

export class CreateDayPriceBulkDto {
  @IsUUID()
  roomId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleDayPriceDto)
  prices: SingleDayPriceDto[];
}
