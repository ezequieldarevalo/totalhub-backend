interface PriceCalculationParams {
  basePrice: number;
  isResident: boolean;
  paymentMethod: 'card' | 'cash';
  hasMuchiCard: boolean;
}

export function calculateFinalPricePerDay({
  basePrice,
  isResident,
  paymentMethod,
  hasMuchiCard,
}: PriceCalculationParams): number {
  let final = basePrice;

  if (!isResident) {
    if (paymentMethod === 'card') {
      final *= 1.3333;
    }
    if (hasMuchiCard) {
      final *= 0.9;
    }
  } else {
    if (paymentMethod === 'card') {
      final *= 1.3333;
    }
  }

  return Math.round(final * 100) / 100;
}
