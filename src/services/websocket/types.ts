export type WsChannel = 'ticker' | 'orderbook' | 'trades' | 'orders' | 'positions'

export type WsInboundMessage =
  | { channel: 'ticker'; payload: { tickers: unknown } }
  | { channel: 'orderbook'; payload: { bids: unknown; asks: unknown } }
  | { channel: 'trades'; payload: { fills: unknown } }
  | { channel: 'orders'; payload: { orders: unknown } }
  | { channel: 'positions'; payload: { positions: unknown } }

export type WsMessageHandler = (msg: WsInboundMessage) => void
