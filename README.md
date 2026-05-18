# 05-SpeedOrder

공통 mock 주문·호가 엔진 (HTS형 UI). **실거래 API 없음.**

## 개발 서버

```bash
npm install
npm run dev
```

| 항목 | 값 |
|------|-----|
| **URL** | [http://localhost:5105/](http://localhost:5105/) |
| **포트** | `5105` (`vite.config.ts`, `strictPort: true`) |
| **고정 이유** | TGX / MockInvest / UTE와 병행 개발 시 포트 충돌 방지 |

포트가 이미 사용 중이면 Vite가 종료됩니다. 다른 프로세스를 종료하거나 `vite.config.ts`의 `port`를 조정하세요.

## 검증

```bash
npm run lint
npm run build
npm run test    # vitest + smoke
npm run smoke   # headless self-test only
```

## 문서

- [MASTER_MANUAL.md](MASTER_MANUAL.md) — 통합 진입점
- [ARCHITECTURE.md](ARCHITECTURE.md) — 폴더·컴포넌트
- [docs/SELF_TEST.md](docs/SELF_TEST.md) — Diagnostics / smoke
- [docs/TRADING_WORKSPACE.md](docs/TRADING_WORKSPACE.md) — 자산군별 거래창 (**W5** `TradingWorkspaceHost` embed 포함)
