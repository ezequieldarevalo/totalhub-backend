import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  roomId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaid?: number; // 👈 NUEVO agregado respetando tu estructura
}
