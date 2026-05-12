# 05-SpeedOrder — 아키텍처 개요

한국 HTS 속도감 + Toss식 단순 UI + Bitget형 선물 패널을 목표로 한 **공통 거래창 UI 엔진**입니다.  
지금은 **mock 데이터 + 주기적 시뮬레이션**만 사용하며, **실거래/실계좌 연결은 하지 않습니다.**

## 기술 스택

- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Zustand (`src/store/tradingStore.ts`)
- 에러 바운더리 + `React.lazy` / `Suspense`로 패널/페이지 단위 격리

## 폴더 구조

```
src/
  components/
    orderbook/     OrderBookPanel
    speedorder/    SpeedOrderPanel
    position/      PositionPanel
    history/       TradeHistoryPanel
    chart/         ChartArea (TradingView 등 연결 슬롯)
    ticker/        TopTickerBar
    common/        ErrorBoundary, PanelShell
  layouts/         TradingLayout (반응형 그리드)
  pages/           TradingPage (패널 조합 + mock 실시간)
  services/
    websocket/     WebSocketClient 스텁 + 메시지 타입
    websocketService/  위 모듈 re-export (네이밍 통일용)
  store/           Zustand 스토어 + 모의 주문 헬퍼
  hooks/           useMockRealtime (mock tick)
  mock/            mockData, mockSimulate
  types/           공용 타입
  utils/           safe*, format*
```

## 컴포넌트 역할

| 컴포넌트 | 역할 |
|----------|------|
| **TopTickerBar** | BTC / ETH / NASDAQ / GOLD 틱 요약. 스토어의 `tickers` 배열을 그대로 표시 (`safeArray`). |
| **ChartArea** | 차트 SDK 자리. 기본은 안내 문구만; 호스트에서 children/ref로 위젯 마운트 예정. `React.lazy`로 분리 로드 가능. |
| **OrderBookPanel** | 매도·매수 호가, 수량, 누적, 중앙 **현재가** 띠. 데이터는 스토어 `orderBook` + `lastPrice`. |
| **SpeedOrderPanel** | 시장가/지정가, 수량 프리셋, 롱·숏(모의), 확인 ON/OFF, 초보자/전문가 모드 플래그. |
| **PositionPanel** | 포지션 테이블, 손익·수익률, **모의 청산** (`closePositionDemo`). |
| **TradeHistoryPanel** | 체결 / 주문 / 취소 탭 + 심볼 필터. |
| **TradingLayout** | PC: 차트 + 우측 호가/주문열, 하단 포지션·내역. 모바일: 세로 스택. |
| **ErrorBoundary** | 패널 단위 오류 시 해당 영역만 대체 UI. 루트 `App`에도 동일 패턴. |

## 상태 관리 (Zustand)

- 단일 스토어: `useTradingStore`
- 도메인 필드: `symbol`, `lastPrice`, `orderBook`, `tickers`, `positions`, `fills`, `orders`
- UI 필드: `beginnerMode`, `confirmOrders`
- **외부 데이터 주입용 액션** (WebSocket / 호스트 앱이 호출):
  - `applyOrderBook`, `applyLastPrice`, `applyTickers`, `patchTicker`
  - `setPositions`, `pushFill`, `upsertOrder`, `cancelOrder`, `setSymbol`
- **mock 전용**: `applyMockTick` — `useMockRealtime`이 주기적으로 호출해 호가·티커·미실현 손익을 갱신

모의 주문은 `placeSpeedOrderDemo`가 `fills` / `orders`에만 반영합니다 (체결 엔진 없음).

## mock 실시간 갱신

- `hooks/useMockRealtime.ts` → `mock/mockSimulate.simulateTick`이 가격·호가·티커를 살짝 변동시킨 뒤 `applyMockTick`으로 커밋합니다.
- 프로덕션에서는 이 훅을 제거하고, 동일한 스토어 액션을 **WebSocket 핸들러**에서 호출하면 됩니다.

## WebSocket 연결 포인트

1. **`services/websocket/WebSocketClient.ts`**  
   - `connect(url)`, `disconnect`, `subscribe` 스텁  
   - `onMessage(handler)`로 수신 → JSON 파싱 후 등록된 핸들러에 전달 (핸들러 내부 try/catch로 연쇄 오류 차단)

2. **권장 매핑 (수신 → 스토어)**  

   | 메시지 채널 (예시) | 스토어 액션 |
   |--------------------|-------------|
   | ticker 스냅샷 | `applyTickers` 또는 `patchTicker` |
   | orderbook 스냅샷 | `applyOrderBook` |
   | last / mark | `applyLastPrice` (+ 필요 시 호가 재빌드는 서버 데이터 우선) |
   | positions | `setPositions` |
   | fills | `pushFill` |
   | orders | `upsertOrder` / `cancelOrder` |

3. **호스트 앱 부트스트랩 예시 (의사코드)**

```ts
const client = new WebSocketClient(import.meta.env.VITE_WS_URL)
const unsub = client.onMessage((msg) => {
  if (msg.channel === 'orderbook') {
    useTradingStore.getState().applyOrderBook(msg.payload as OrderBookSnapshot)
  }
  // ...
})
client.connect()
```

실제 `WsInboundMessage` 형식은 거래소/내부 게이트웨이에 맞게 확장하면 됩니다.

## 02-TGX-CEX / 04-MockInvest / OneAI 연결 방법

1. **패키지화** (권장): `src`를 npm workspace 패키지 `@tetherget/speed-order-ui` 등으로 분리하고, 각 앱에서 import.  
2. **모노레포 복사/공유**: `components`·`store`·`types`를 공용 경로로 두고 Vite alias로 참조.  
3. **연결 시 교체 지점**  
   - `useMockRealtime` 제거 → WebSocket 부트스트랩으로 대체  
   - `placeSpeedOrderDemo` → 호스트의 **紙上/실주문 API** 호출 후, 응답으로 `pushFill` / `upsertOrder`만 호출하거나 서버 푸시에 맡김  
   - `ChartArea` → TradingView `container` 또는 자체 차트 루트로 교체  
   - `MOCK_SYMBOL` / `setSymbol`을 라우팅·심볼 선택기와 동기화  

실거래 연결 시에도 **스토어 액션 경계**를 유지하면 UI 컴포넌트 수정을 최소화할 수 있습니다.

## 오류·성능 관련 결정

- 배열/숫자: `utils/safe.ts`, 스토어 `safeArray`로 **undefined 방지**
- 패널마다 `ErrorBoundary` → 한 패널이 터져도 나머지 레이아웃 유지
- 차트 슬롯은 `lazy` + `Suspense`로 **코드 분할** 가능한 형태 유지

## 스크립트

- `npm run dev` — 로컬 개발
- `npm run build` — 타입체크 + 프로덕션 빌드
