# Fundz Escrow — Frontend

Next.js 14 frontend for the Fundz decentralized escrow application on the Stellar Network.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Wallet:** @stellar/freighter-api
- **State:** Zustand
- **Forms:** React Hook Form + Zod

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                         # starts on :3001
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` |

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — all escrows for connected wallet |
| `/create` | 4-step create escrow wizard |
| `/escrow/[id]` | Escrow detail + role-aware action panel |

## Wallet

Requires the [Freighter](https://www.freighter.app/) browser extension on Stellar Testnet.

## Related Repos

- [fundz-escrow-backend](https://github.com/soft-plug/fundz-escrow-backend)
- [fundz-escrow-contract](https://github.com/soft-plug/fundz-escrow-contract)
