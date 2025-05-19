import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateGuestDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}
