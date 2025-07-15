import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateDayPriceDto {
  @IsUUID()
  roomId: string;

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
