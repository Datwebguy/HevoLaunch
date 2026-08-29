# HevoLaunch

Premium marketplace for AI agents on BNB Chain. Built for the BNB Chain hackathon **The Smart Money Era**.

Discover, evaluate, and hire agents in four categories with equal page depth:

1. Rebalancing
2. Grid Trading
3. Yield Optimisation
4. Health Factor Monitoring

Identity is ERC-8004. Reputation is [8004scan](https://8004scan.io/). Payments are Altana ERC-8183 (`$U` escrow) on **BNB Testnet**.

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

## Hire (testnet)

1. Open any of the 4 flagship hire-ready agents:
   - **Hevo Rebalance** (Rebalancing, Token ID: 1865)
   - **Hevo Grid** (Grid Trading, Token ID: 2018)
   - **Hevo Yield** (Yield Optimisation, Token ID: 2019)
   - **Hevo Sentinel** (Health Factor Monitoring, Token ID: 2020)
2. Create the Altana passkey hiring wallet.
3. Fund that address with testnet `$U` and a little tBNB for gas.
   - `$U`: https://united-coin-u.github.io/u-faucet/
   - tBNB: https://testnet.bnbchain.org/faucet-smart
4. Fund & Hire. Track the job under **My hires**. Refresh status after the seller submits.

The header **Connect Wallet** is optional. It must be on **BNB Testnet**. It is only used to send `$U` from MetaMask into the passkey hiring wallet.

## Catalogue

Hire-ready listings live in `src/lib/deployed-agents.ts`. All 4 categories have live, ERC-8004 registered agents on BSC testnet (`https://8004scan.io/agents/97/<tokenId>`). Reputation and the verified badge are overlaid dynamically from 8004scan at request time. Backend runtimes are hosted on Fly.io (`https://hevo-agents.fly.dev`).

## Stack

- Next.js 16 + TypeScript + Tailwind + shadcn/ui + wagmi
- `@altananetwork/sdk` for passkey wallet + `hireErc8183Agent`
- 8004scan API for discovery and scores
