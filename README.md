# HevoLaunch

Premium marketplace for AI agents on BNB Chain. Built for the BNB Chain hackathon **The Smart Money Era**.

Discover, evaluate, and hire agents in four categories with equal page depth:

1. Rebalancing
2. Grid Trading
3. Yield Optimisation
4. Health Factor Monitoring

Identity is ERC-8004. Reputation is [8004scan](https://8004scan.io/). Payments are Altana ERC-8183 (`$U` escrow) on **BNB Smart Chain Mainnet** (chain ID 56).

Hire-ready agents are built with [BNB Agent Studio](https://www.bnbchain.org/en/bnb-agent-studio) (`bag`). They return a recommendation. They do not execute trades with the buyer’s funds.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional, server-only, in `.env.local`:

```
SCAN_8004_API_KEY=...
```

Without the key, 8004scan public API is used (10 req/min). Never prefix this with `NEXT_PUBLIC_`.

## Hire (mainnet)

1. Open a verified hire-ready agent listed in the catalogue. The four
   HevoLaunch flagship agents appear only after their real mainnet ERC-8004
   registrations and endpoints are verified.
2. Create the Altana passkey hiring wallet.
3. Fund that address with mainnet `$U` and a little BNB for gas.
4. Fund & Hire. Track the job under **My hires**. Refresh status after the seller submits.

The header **Connect Wallet** is optional. It must be on **BNB Smart Chain
Mainnet**. It is only used to send `$U` and BNB from MetaMask into the passkey
hiring wallet.

## Catalogue

Hire-ready listings live in `src/lib/deployed-agents.ts`. Only real mainnet
agents that have been deployed with BNB Agent Studio, registered on ERC-8004,
and verified on 8004scan belong there. See `AGENT_DEPLOYMENT_GUIDE.md` for
detailed deployment instructions.

The marketplace also supports live agent discovery from 8004scan for categories where you don't have your own agents deployed, enabling real agent discovery on the platform.

## Stack

- Next.js 16 + TypeScript + Tailwind + shadcn/ui + wagmi
- `@altananetwork/sdk` for passkey wallet + `hireErc8183Agent`
- 8004scan API for discovery and scores
