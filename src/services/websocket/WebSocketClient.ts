import type { WsChannel, WsInboundMessage, WsMessageHandler } from './types'

/**
 * Stub client: host apps (TGX / MockInvest) swap URL + auth and wire `onMessage`
 * to `useTradingStore` actions (`applyOrderBook`, `applyTickers`, …).
 */
export class WebSocketClient {
  private url: string | null = null

  private socket: WebSocket | null = null

  private handlers = new Set<WsMessageHandler>()

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(url?: string) {
    this.url = url ?? null
  }

  onMessage(handler: WsMessageHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  connect(nextUrl?: string): void {
    if (typeof WebSocket === 'undefined') return
    const target = nextUrl ?? this.url
    if (!target) return
    this.url = target
    this.disconnect()
    this.socket = new WebSocket(target)
    this.socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as WsInboundMessage
        this.handlers.forEach((h) => {
          try {
            h(data)
          } catch {
            /* isolate handler errors */
          }
        })
      } catch {
        /* ignore malformed */
      }
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
  }

  /** Placeholder: subscribe channel after connect */
  subscribe(_channels: WsChannel[]): void {
    void _channels
  }

  /** Placeholder: unsubscribe */
  unsubscribe(_channels: WsChannel[]): void {
    void _channels
  }
}
