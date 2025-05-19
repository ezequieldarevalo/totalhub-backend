import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
