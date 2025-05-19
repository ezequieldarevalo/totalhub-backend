import { IsDateString, IsEmail, IsInt, IsNotEmpty, Min } from 'class-validator';

export class PublicCreateReservationDto {
  @IsNotEmpty()
  roomId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}
