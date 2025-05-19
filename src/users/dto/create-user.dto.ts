import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(['ADMIN', 'OPERATOR'], {
    message: 'Role must be ADMIN or OPERATOR',
  })
  role: 'ADMIN' | 'OPERATOR';
}
