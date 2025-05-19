export class ReservationResponseDto {
  id: string;
  startDate: string;
  endDate: string;
  guests: number;
  cancelled: boolean;
  name: string | null;
  email: string | null;
  totalPrice: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  room: {
    id: string;
    name: string;
  };
  payments: {
    amount: number;
  }[];
  guest?: {
    id: string;
    name: string;
    email: string;
  };

  static fromEntity(entity: {
    id: string;
    startDate: Date;
    endDate: Date;
    guests: number;
    cancelled: boolean;
    name: string | null;
    email: string | null;
    totalPrice: number;
    paymentStatus: 'pending' | 'partial' | 'paid';
    room: {
      id: string;
      name: string;
    };
    payments: {
      amount: number;
    }[];
    guest?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }): ReservationResponseDto {
    const dto = new ReservationResponseDto();
    dto.id = entity.id;
    dto.startDate = entity.startDate.toISOString();
    dto.endDate = entity.endDate.toISOString();
    dto.guests = entity.guests;
    dto.cancelled = entity.cancelled;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.paymentStatus = entity.paymentStatus;
    dto.totalPrice = entity.totalPrice;
    dto.room = {
      id: entity.room.id,
      name: entity.room.name,
    };
    dto.payments = entity.payments;
    if (entity.guest) {
      dto.guest = {
        id: entity.guest.id,
        name: entity.guest.name,
        email: entity.guest.email,
      };
    }
    return dto;
  }
}
