# HevoLaunch Agent Deployment Guide

This guide will help you deploy your 4 Hevo agents to BNB Testnet (97) and register them on 8004scan for the BNB Chain hackathon "The Smart Money Era".

## Pricing Configuration

All agents are configured to cost **$0.05 per hire** in $U tokens.

## Step 1: Install BNB Agent Studio

```bash
pip install bnbagent-studio
```

## Step 2: Initialize Your Agent Workspace

```bash
# Create a directory for your agents
mkdir hevo-agents
cd hevo-agents

# Initialize the workspace
bag init
```

## Step 3: Deploy Each Agent

### Hevo Rebalance (Portfolio Rebalancing)

```bash
# Create the agent
bag create agent hevo-rebalance \
  --category rebalancing \
  --description "Reads a wallet's current holdings against a target allocation and returns the exact trade set needed to close the drift"

# Deploy the agent
bag deploy agent

# Verify the deployment
bag deploy verify

# Register on ERC-8004
bag erc8004 register

# Get the agent details
cat .studio/wallets/agent-hevo-rebalance.json
```

**Note down these values:**
- `agent_id` (token ID)
- `address` (identity address)

### Hevo Grid (Grid Trading)

```bash
bag create agent hevo-grid \
  --category grid-trading \
  --description "Computes a grid trading plan for a pair and price range — levels, order sizes, and expected capture"

bag deploy agent
bag deploy verify
bag erc8004 register
cat .studio/wallets/agent-hevo-grid.json
```

### Hevo Yield (Yield Optimisation)

```bash
bag create agent hevo-yield \
  --category yield-optimisation \
  --description "Compares yield opportunities across BNB Chain lending and liquid staking protocols"

bag deploy agent
bag deploy verify
bag erc8004 register
cat .studio/wallets/agent-hevo-yield.json
```

### Hevo Sentinel (Health Factor Monitoring)

```bash
bag create agent hevo-sentinel \
  --category health-factor-monitoring \
  --description "Checks lending positions against safety thresholds on Venus and Aave V3"

bag deploy agent
bag deploy verify
bag erc8004 register
cat .studio/wallets/agent-hevo-sentinel.json
```

## Step 4: Configure Pricing

For each agent, edit the `studio.toml` file to set pricing to $0.05 per hire:

```toml
[payments.erc8183]
price = "50000000000000000"  # 0.05 $U in wei (18 decimals)
max_price = "100000000000000000"  # 0.1 $U max
```

**Wei conversion for $0.05:**
- $U has 18 decimals
- 0.05 $U = 0.05 × 10^18 = 50,000,000,000,000,000 wei

## Step 5: Update HevoLaunch Configuration

After deploying all 4 agents, update `src/lib/deployed-agents.ts` with the real values:

```typescript
{
  category: "rebalancing",
  name: "Hevo Rebalance",
  // ... other fields
  agentIdentityAddress: "0xYOUR_REAL_ADDRESS", // From .studio/wallets/agent-hevo-rebalance.json
  agentId: YOUR_REAL_AGENT_ID, // From registration output
}
```

Do this for all 4 agents.

## Step 6: Verify on 8004scan

Check each agent on 8004scan:
- https://8004scan.io/agents/97/YOUR_AGENT_ID

You should see:
- Agent name and description
- ERC-8004 registration details
- Endpoint information (if deployed)
- Reputation data (will start at 0)

## Important Notes

- **Testnet Only**: This is for BNB Testnet (97) - no real money required
- **Free Testnet BNB**: Get tBNB from https://testnet.bnbchain.org/faucet-smart
- **Free Testnet $U**: Get $U from https://united-coin-u.github.io/u-faucet/
- **No Real Costs**: Testnet has no financial risk
- **Reputation**: Starts at 0, builds up with actual usage
- **Security**: Keep your agent private keys secure
- **Maintenance**: Monitor agent uptime and update as needed

## Troubleshooting

### Agent Registration Fails
- Ensure you have enough tBNB for gas
- Check your wallet connection
- Verify BNB Agent Studio is properly installed

### 8004scan Not Showing Agent
- Wait a few minutes for indexing
- Check if the agent ID is correct
- Verify the registration transaction went through

### Endpoint Calls Fail
- Ensure runtimes are deployed and accessible
- Check CORS configuration
- Verify A2A protocol implementation

## Next Steps

After deployment:
1. Monitor agent performance and reputation
2. Gather user feedback
3. Improve agent capabilities
4. Expand to more categories
5. Add more agents per category