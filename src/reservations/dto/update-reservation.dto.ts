import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsEmail,
  Min,
} from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  guests?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
