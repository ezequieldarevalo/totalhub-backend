import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  roomTypeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  featureIds?: string[];
}
