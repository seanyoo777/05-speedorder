/** 호가/주문 가격을 tickSize에 맞춤 */
export function roundToTickSize(price: number, tickSize: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(tickSize) || tickSize <= 0) return price
  const rounded = Math.round(price / tickSize) * tickSize
  const decimals = Math.max(0, Math.ceil(-Math.log10(tickSize)))
  return Number(rounded.toFixed(decimals))
}

/** 수량을 lotSize 배수로 맞춤 (가장 가까운 배수; 최소 1 lot) */
export function roundToLotSize(qty: number, lotSize: number): number {
  if (!Number.isFinite(qty) || !Number.isFinite(lotSize) || lotSize <= 0) return qty
  let n = Math.round(qty / lotSize)
  if (qty > 0 && n < 1) n = 1
  const rounded = n * lotSize
  const decimals = Math.max(0, Math.ceil(-Math.log10(lotSize)))
  return Number(rounded.toFixed(decimals))
}
