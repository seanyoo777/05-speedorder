/**
 * 05-SpeedOrder 주문 실행 정책 — UTE·모니터링이 스토어 없이도 정책을 읽을 수 있게 하는 고정 계약.
 * 이 패키지는 항상 mock/demo; 실거래 주문 API·실체결은 비활성입니다.
 */
export type OrderExecutionPolicy = {
  readonly packageId: '05-speedorder'
  readonly mode: 'mock_demo'
  readonly liveOrderApiEnabled: false
  readonly liveExecutionEnabled: false
  /** 호스트가 나중에 live 어댑터를 붙일 때만 의미 있는 확장 훅(현재 항상 false) */
  readonly hostMayAttachLiveAdapter: false
}

export const ORDER_EXECUTION_POLICY: OrderExecutionPolicy = {
  packageId: '05-speedorder',
  mode: 'mock_demo',
  liveOrderApiEnabled: false,
  liveExecutionEnabled: false,
  hostMayAttachLiveAdapter: false,
} as const
