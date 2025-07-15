import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

export class PublicCreateReservationDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsBoolean()
  isResident: boolean;

  @IsBoolean()
  hasMuchiCard: boolean;

  @IsOptional()
  @IsString()
  muchiCardType?: 'cash' | 'debit' | 'credit';

  @IsString()
  lang: string;
}
