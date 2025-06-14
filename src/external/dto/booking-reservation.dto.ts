import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsNumber,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RawDataDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  guests: number;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

export class BookingReservationDto {
  @IsString()
  @IsNotEmpty()
  connectionId: string;

  @IsString()
  @IsNotEmpty()
  externalResId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsObject()
  @ValidateNested()
  @Type(() => RawDataDto)
  rawData: RawDataDto;
}
