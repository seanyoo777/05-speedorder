/**
 * 호스트 앱에서 `services/websocket` 대신 이 엔트리를 import해도 됩니다.
 * 네이밍만 `websocketService`로 통일하고 싶을 때 사용하세요.
 */
export { WebSocketClient } from '../websocket'
export type { WsChannel, WsInboundMessage, WsMessageHandler } from '../websocket'
