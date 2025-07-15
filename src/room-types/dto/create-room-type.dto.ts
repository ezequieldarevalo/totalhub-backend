import { IsString, IsInt, Min } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsInt()
  @Min(1)
  capacity: number;
}
