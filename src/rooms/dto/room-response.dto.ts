// src/rooms/dto/room-response.dto.ts
import { Room } from '@prisma/client';

export class RoomResponseDto {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(room: Room): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = room.id;
    dto.name = room.name;
    dto.slug = room.slug;
    dto.capacity = room.capacity;
    dto.createdAt = room.createdAt;
    dto.updatedAt = room.updatedAt;
    return dto;
  }
}
