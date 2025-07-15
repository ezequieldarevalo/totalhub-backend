export class RoomResponseDto {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
  features?: { id: string; slug: string }[];

  static fromEntity(room: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    roomType: {
      name: string;
      slug: string;
      capacity: number;
    } | null;
    features?: { id: string; slug: string }[];
  }): RoomResponseDto {
    if (!room.roomType) {
      throw new Error('RoomType is missing in the room entity');
    }

    const dto = new RoomResponseDto();
    dto.id = room.id;
    dto.name = room.roomType.name;
    dto.slug = room.roomType.slug;
    dto.capacity = room.roomType.capacity;
    dto.createdAt = room.createdAt;
    dto.updatedAt = room.updatedAt;
    dto.features = room.features;
    return dto;
  }
}
