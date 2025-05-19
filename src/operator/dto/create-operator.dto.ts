import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOperatorDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
