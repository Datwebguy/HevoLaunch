# Memory – HevoLaunch

- Product name: HevoLaunch
- Brand new project for BNB Smart Money Era hackathon
- Must give equal depth to the 4 required categories
- Primary tools: BNB Agent Studio + 8004scan + Altana
- "we will continue until this is done properly, we will treat every run as if it will be successful because we will learn from failures and consult best information before proceeding forward such that we are confident that result will be a success. we will not plan for failure"
- Rule: always reference the real docs links below before integrating or changing anything in these areas — go back to them, and cross-check previous integrations against them too, don't rely on memory/assumptions.
- Step-by-step build in progress (user's own 8-step plan): Step 1 (real 8004scan data) done & accepted. Step 2 (deploy 4 flagship agents) in progress — user is deploying manually via BNB Agent Studio using the briefs in `agent-briefs.md`; 4 agents named Hevo Rebalance / Hevo Grid / Hevo Yield / Hevo Sentinel. Once deployed, their address + 8004scan token id go into `src/lib/deployed-agents.ts` (plumbing already built, currently empty). Steps 3-8 (detail page, hiring flow refinement, homepage/UX, search, polish, testing) still ahead.
- **IMPORTANT architectural correction (learned while user deployed agent #1):** `bnbagent-studio` (`bag`) sellers are paid $U to PRODUCE A DELIVERABLE (text/analysis/computed plan) — per the framework's own docs, "sellers receive U, don't spend." There is no supported path for an agent to autonomously execute PancakeSwap swaps or move funds through Venus/Aave with a buyer's money; all signing is fixed non-LLM code in `app/agent/signing.py`, scoped to payment authorization only (EIP-3009/EIP-712), not general DeFi execution. My first draft of `agent-briefs.md` wrongly referenced "Altana skills" (`pancakeswap-trading`, `venus-lending`, etc.) that don't exist inside `bag` projects at all — caught when the user's own bag-assistant session couldn't find them. Rewrote all 4 briefs to have each agent DELIVER a recommendation/analysis instead of executing trades — matches real OKX.AI agents (e.g. their "Tachyo" agent is a pure signal/analysis provider). Ground truth lives in the `bnbagent-studio` Claude Code skill installed locally (`~/.claude/skills/bnbagent-studio/`), specifically `references/bnbagent-studio-selling-via-8183.md` and `references/bnbagent-studio-extending-signing.md` — read those before making any other bag-related claims, not the bnbchain.org blog/docs pages (those turned out to describe an outdated/different workspace layout: real layout is ONE sub-project `app/agent/` serving A2A on :9000 or MCP on :8000/mcp, not the "app/agent :8080 + app/service :8003" two-layer split I originally wrote from the blog post).

## Reference links

### BNB Agent Studio
- https://www.bnbchain.org/en/bnb-agent-studio
- https://www.bnbchain.org/en/blog/bnb-agent-studio-is-live-on-bnb-chain-ai-agents-from-one-prompt
- https://docs.bnbchain.org/developer-kit/bnbchain-studio/ — ground truth for CLI install: `pip install bnbagent-studio` (a blog post claimed `npm install -g @bnbagent/studio-cli` — wrong, don't trust it)
- https://github.com/bnb-chain/bnbagent-sdk — `@bnbagent/sdk` (npm) / `bnbagent` (pip), the agent-builder-side SDK. `ERC8183JobOps` + `fundedJobWatcher` is the provider loop an agent runs to pick up jobs funded via Altana's `hireErc8183Agent` — same on-chain kernel as the buyer-side flow already built in `lib/altana.ts`

### BNB Chain / testnet
- https://testnet.bnbchain.org/faucet-smart (fund testnet wallets with BNB)

### Altana (payments & sessions — x402 + ERC-8183)
- https://docs.altana.network/ (root)
- https://docs.altana.network/concepts/sessions
- https://docs.altana.network/sdk/erc8183
- https://docs.altana.network/sdk/x402-server
- https://skills.altana.network/
- https://github.com/altananetwork/altana-sdk
- npm package: @altananetwork/sdk (installed in this repo)

### 8004scan (discovery & reputation)
- https://8004scan.io/developers
- https://8004scan.io/ (site root — safe to link to; do not guess per-agent deep-link URLs)
- Public API base: https://8004scan.io/api/v1/public/ (no key required, rate-limited: 10 req/min / 100 daily anonymous)

### PancakeSwap
- https://developer.pancakeswap.finance/
- https://docs.pancakeswap.finance/
- WebFetch on both returned an unreliable/garbled router address (41 hex chars — invalid). Don't trust that fetch result; re-verify via the real SDK/contracts repo before hardcoding any PancakeSwap address. Not currently used anywhere in the app — mentioned only as prose on the Become a Provider page (agents route trades through it; HevoLaunch itself doesn't execute swaps, so no address is needed here).

### TermiX
- https://app.termix.ai/
- https://github.com/TermiX-official/bsc-mcp (WebFetch was blocked/403 on this one)
- Real npm package (confirmed via `npm view`/registry, published by termix-it): `bnbchain-mcp` — install `npm install -g bnbchain-mcp`, then `bnbchain-mcp --init`. Exposes PancakeSwap swaps, BEP-20 transfers, wallet balances, contract calls as MCP tools. Mentioned on the Become a Provider page as optional agent-side execution tooling.

### Other
- https://forms.gle/jQevEPCAacBXaKG79 (form — purpose not yet confirmed with user)
