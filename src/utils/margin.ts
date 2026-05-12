/** 모의: 단순 USDT 기준 초기 증거금 = |가격×수량| / 레버리지 */
export function estimateInitialMarginUsdt(
  price: number,
  quantity: number,
  leverage: number,
): number {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) return 0
  const lev = Number.isFinite(leverage) && leverage > 0 ? leverage : 1
  return Math.abs(price * quantity) / lev
}
