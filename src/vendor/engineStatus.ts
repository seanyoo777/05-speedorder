/** 엔진 런타임 식별 — 직렬화·로그·UTE 게이트용 */
export type SpeedOrderEngineStatus = {
  readonly kind: 'mock'
  readonly packageId: '05-speedorder'
  /** 엔진이 제공하는 기능 토큰(문자열 고정; 외부에서 분기용) */
  readonly capabilities: readonly [
    'mock_speed_submit',
    'mock_immediate_market',
    'net_position_fill',
    'hedge_position_fill',
    'conditional_mit_stop',
    'market_sync_store_actions',
  ]
}

export const SPEED_ORDER_ENGINE_STATUS: SpeedOrderEngineStatus = {
  kind: 'mock',
  packageId: '05-speedorder',
  capabilities: [
    'mock_speed_submit',
    'mock_immediate_market',
    'net_position_fill',
    'hedge_position_fill',
    'conditional_mit_stop',
    'market_sync_store_actions',
  ],
} as const
