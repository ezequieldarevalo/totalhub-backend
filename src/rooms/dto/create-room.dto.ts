import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
