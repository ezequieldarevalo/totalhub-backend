export class PaymentResponseDto {
  id: string;
  amount: number;
  createdAt: string;

  static fromEntity(entity: { id: string; amount: number; createdAt: Date }) {
    const dto = new PaymentResponseDto();
    dto.id = entity.id;
    dto.amount = entity.amount;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
