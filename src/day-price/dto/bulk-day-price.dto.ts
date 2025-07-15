import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class BulkDayPriceDto {
  @IsArray()
  @IsUUID('all', { each: true })
  roomIds: string[];

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableCapacity?: number;

  @IsBoolean()
  overwrite: boolean;
}
