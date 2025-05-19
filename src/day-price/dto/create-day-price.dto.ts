import { IsDateString, IsInt, IsUUID, Min } from 'class-validator';

export class CreateDayPriceDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsUUID()
  roomId: string;
}
