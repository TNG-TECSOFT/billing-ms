export function isValueBetweenRange({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  return value >= min && value <= max;
}

export enum Variances {
  PESO = 'Peso',
  PESO_VOLUMETRICO = 'Peso Volumétrico',
  UNIDADES = 'Unidades',
  MAYOR_P_PVOL = 'Mayor entre Peso y P. Volumétrico',
}

export enum CriteriaLabel {
  NODO = 'Nodo',
  ZONA = 'Zona',
}

export function calculateVolumetricWeight({
  length,
  width,
  height,
  dimensionalFactor,
}: {
  length: number;
  width: number;
  height: number;
  dimensionalFactor: number;
}) {
  return (height * width * length) / dimensionalFactor;
}

/**
 * Calculates price + extra for pieces that surpasses the weight limit of the billing rule
 * @param prices: [{}...] of billing prices
 * @param weight: number, can be 'Unidades' or 'Peso'
 * @returns number
 */
function calculateAdditionalPrice({ prices, weight }) {
  const lastPrice = prices.reduce((prev, curr) =>
    prev.max_value > curr.max_value ? prev : curr,
  );
  const additional = prices.find((p) => p.additional);
  const BASE_PRICE = lastPrice.price;
  const ADDITIONAL_PRICE = (weight - lastPrice.max_value) * additional.price;
  return BASE_PRICE + ADDITIONAL_PRICE;
}

/**
 * Function to calculate price by piece using piece weight and billing rules (prices)
 * For 'Unidades' it uses the length of pieces in an order to calculate final price
 * @param prices: [] of billing prices
 * @param weight: number
 * @returns number
 */
export function calculatePriceByVariance({ prices, weight }) {
  let calculatedPrice = prices.find((price) =>
    isValueBetweenRange({
      value: weight,
      min: price.min_value,
      max: price.max_value,
    }),
  );
  return !!calculatedPrice
    ? calculatedPrice.price
    : calculateAdditionalPrice({ prices, weight });
}

/**
 * Function to calculate price by piece using piece weight and billing rules (prices)
 * For 'Unidades' it uses the length of pieces in an order to calculate final price
 * @param piece: Piece entity
 * @param prices: [] of billing prices
 * @param weight: number
 * @returns number
 */
export function calculatePieceBillingAmountByWeight({
  piece,
  prices,
  variance,
  dimensionalFactor,
}) {
  const pieceWeight: number = piece.weight ? parseFloat(piece.weight) : 0;
  let volumetricWeight: number = 0;
  let calculatedWeight: number = 0;

  if (!!piece.length && !!piece.height && !!piece.width) {
    volumetricWeight = calculateVolumetricWeight({
      length: parseFloat(piece.length),
      width: parseFloat(piece.width),
      height: parseFloat(piece.height),
      dimensionalFactor,
    });
  }

  switch (variance) {
    case Variances.PESO_VOLUMETRICO:
      calculatedWeight = volumetricWeight ? volumetricWeight : 0;
      break;
    case Variances.MAYOR_P_PVOL:
      calculatedWeight =
        volumetricWeight > pieceWeight ? volumetricWeight : pieceWeight;
      break;
    default:
      calculatedWeight = pieceWeight ? pieceWeight : 0;
      break;
  }

  if (calculatedWeight > 0) {
    return calculatePriceByVariance({
      prices,
      weight: calculatedWeight,
    });
  } else {
    return 0;
  }
}
