// src/room-types/dto/room-type-response.dto.ts

import { RoomType } from '@prisma/client';

export class RoomTypeResponseDto {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(roomType: RoomType): RoomTypeResponseDto {
    const dto = new RoomTypeResponseDto();
    dto.id = roomType.id;
    dto.name = roomType.name;
    dto.slug = roomType.slug;
    dto.capacity = roomType.capacity;
    dto.createdAt = roomType.createdAt;
    dto.updatedAt = roomType.updatedAt;
    return dto;
  }
}
