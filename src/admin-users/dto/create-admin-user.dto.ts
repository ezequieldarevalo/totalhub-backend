import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  hostelId: string;
}
