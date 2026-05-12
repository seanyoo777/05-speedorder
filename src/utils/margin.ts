/** 모의: 단순 USDT 기준 초기 증거금 = |가격×수량| / 레버리지 */
export function estimateInitialMarginUsdt(
  price: number,
  quantity: number,
  leverage: number,
): number {
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0
  const lev = Number.isFinite(leverage) && leverage > 0 ? leverage : 1
  return Math.abs(price * quantity) / lev
}
