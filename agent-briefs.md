# HevoLaunch — Flagship Agent Briefs

Four agents to build with BNB Agent Studio (`bag`), one per mandatory category.
Naming convention: `Hevo <Category>` — HevoLaunch's own house-brand agents.

**Rewritten from the ground up** after hitting real walls building the first
one — the earlier version referenced "Altana skills" (`pancakeswap-trading`,
`venus-lending`, etc.) that don't exist inside `bag`-scaffolded projects at
all. Grounded now in the actual `bnbagent-studio` skill installed locally
(`~/.claude/skills/bnbagent-studio/`), specifically
`references/bnbagent-studio-selling-via-8183.md` and
`references/bnbagent-studio-extending-signing.md` — not blog posts.

## The one architectural fact that changes everything

A `bag`-built seller agent is paid $U to **produce a deliverable** — text,
analysis, a computed plan. Per the framework's own precondition: *"Wallet has
≥0.05 tBNB (gas)... and ≥0 U (**sellers receive U, don't spend**)."* All
money-moving signing is fixed, non-LLM code in `app/agent/signing.py`, scoped
specifically to payment authorization (EIP-3009 job settlement, EIP-712
quotes) — there's no supported, safe path for the agent to autonomously
execute a PancakeSwap swap or move funds through Venus/Aave with a buyer's
money. That's a deliberate safety boundary, not a gap to route around.

So every agent below **delivers a recommendation, not a live trade** — the
buyer (or their own tooling) acts on it. This is also strictly simpler to
build: none of these four need any signing.py extension at all. They use
`bag init`'s default setup untouched.

If full autonomous execution is wanted later, that's a deliberate, hand-written
extension to `signing.py` per `bnbagent-studio-extending-signing.md` — real
work, reviewed, not a one-line skill reference. Not in scope for v1.

## What every agent actually implements

One function, `run_work(job_id, context) -> str` in the emitted agent code —
the hook the framework calls once a buyer's job is funded. It should read
whatever it needs (chain state, an API) and return the deliverable text. Fixed
pricing lives in `app/agent/studio.toml`:

```toml
[payments.erc8183]
currency = "0x..."   # $U token — prefilled by bag init
price = "..."         # raw wei — asking price the quote signs
min_price = "..."     # raw wei — clamp floor
max_price = "..."     # raw wei — clamp ceiling
quote_ttl_seconds = 300
default_estimated_completion_seconds = 600
```

Deploy sequence (same for all four, real commands from the skill):

```bash
bag deploy prepare
bag deploy provision-cognito     # first time only — then cdk deploy + wire it
bag deploy agent
bag deploy verify                # registers ERC-8004 identity against the live endpoint
```

---

## 1. Rebalancing — **Hevo Rebalance**

**Description:** Reads a wallet's current holdings against a target
allocation and delivers the exact trade set needed to close the drift.

**CLI name:** `hevo-rebalance`

**Prompt:**

> Create a new BNB agent named hevo-rebalance on BSC testnet. Implement
> `run_work` so that, given a job whose context includes a wallet address, a
> target allocation (token weights), and a drift threshold, it reads the
> wallet's current token balances, computes drift against the target, and
> returns a deliverable describing: current allocation, drift per asset, and
> the minimal trade set (which tokens to sell/buy and approximate amounts) to
> return to target — only if drift exceeds the threshold; otherwise report
> that no rebalance is needed. This agent analyses and recommends — it does
> not execute trades itself.

**Pricing:** 5-15 $U depending on portfolio size (set via `min_price`/`max_price`).

---

## 2. Grid Trading — **Hevo Grid**

**Description:** Computes a grid trading plan for a pair and price range —
levels, order sizes, and expected capture — as a deliverable a buyer (or
their own bot) can execute.

**CLI name:** `hevo-grid`

**Prompt:**

> Create a new BNB agent named hevo-grid on BSC testnet. Implement `run_work`
> so that, given a job whose context includes a trading pair, a price range
> (lower/upper bound), and a number of grid levels, it computes a grid
> trading plan: the price of each buy/sell level, order size per level, and
> a note on expected capture per full cycle given recent volatility for the
> pair. Return this plan as the deliverable. This agent designs the grid —
> it does not place live orders itself.

**Pricing:** 10-20 $U per plan.

---

## 3. Yield Optimisation — **Hevo Yield**

**Description:** Compares yield across BNB Chain lending/staking markets and
delivers a recommended allocation.

**CLI name:** `hevo-yield`

**Prompt:**

> Create a new BNB agent named hevo-yield on BSC testnet. Implement
> `run_work` so that, given a job whose context includes an amount and a risk
> tier (stablecoin-only vs. broader), it looks up current yield across Venus,
> Aave V3, and Lista liquid staking on BNB Chain (via public APIs or on-chain
> reads), and returns a deliverable recommending where to allocate: the
> chosen market(s), current APY, and reasoning. This agent recommends — it
> does not move the buyer's funds itself.

**Pricing:** 8-12 $U per recommendation.

---

## 4. Health Factor Monitoring — **Hevo Sentinel**

**Description:** Checks a lending position's health factor against a
buyer-set safety threshold and delivers a status + recommended action.

**CLI name:** `hevo-sentinel`

**Prompt:**

> Create a new BNB agent named hevo-sentinel on BSC testnet. Implement
> `run_work` so that, given a job whose context includes a wallet address,
> the protocol(s) to check (Venus and/or Aave V3), and a safety threshold
> (default 1.3), it reads the wallet's current health factor on-chain and
> returns a deliverable: current health factor, whether it's below
> threshold, and if so a specific recommended action (add N collateral, or
> repay N debt) to restore a safe buffer. This agent watches and recommends —
> it does not execute the top-up/repay itself.

**Pricing:** 8-20 $U depending on monitoring duration.

---

## Plugging deployed agents into HevoLaunch

Once an agent is live and registered on 8004scan, fill in its entry in
[`src/lib/deployed-agents.ts`](src/lib/deployed-agents.ts):

```ts
{
  category: "rebalancing",
  name: "Hevo Rebalance",
  tagline: "...",
  description: "...",
  capabilities: [...],
  pricing: { model: "subscription", amount: 25, currency: "USDC", cadence: "per month" },
  agentIdentityAddress: "0x...",  // the agent's wallet — the address ERC-8004 registered as owner
  agentId: 0,                      // the token id from the agent's 8004scan page
}
```

That's the only file that needs editing — it automatically replaces that
category's featured curated agent with the real one (`verified: true`, same
array slot, so category counts and "equal depth" stay intact).
