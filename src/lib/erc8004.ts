import { erc8183Addresses } from "@altananetwork/sdk";

import type { Agent } from "@/lib/types";

/**
 * ERC-8004 identity, grounded in @altananetwork/sdk's real erc8004.ts /
 * erc8183.ts. Two facts from the SDK that shape this file:
 *
 *  - The identity registry is a plain ERC-721: an agent's identity is a
 *    token id (`agentId`) whose `tokenURI` is its registration record —
 *    not a per-agent contract or vanity address.
 *  - That registry is the SAME contract `erc8183Addresses(chainId).registry`
 *    points at, so we read the real deployed address straight from the
 *    SDK rather than hardcoding it — see ERC8183_ADDRESSES in
 *    node_modules/@altananetwork/sdk/dist/erc8183.js for the source values.
 *
 * We target BNB Testnet (97) throughout, matching lib/altana.ts and
 * lib/wagmi.ts.
 */

export const IDENTITY_CHAIN_ID = 97;

export function getIdentityRegistryAddress(): `0x${string}` {
  return erc8183Addresses(IDENTITY_CHAIN_ID).registry;
}

export interface AgentRegistrationRecord {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
  name: string;
  description: string;
  services: { name: string; endpoint: string }[];
  registrations: { agentId: number; agentRegistry: string }[];
}

/**
 * The registration record this agent's `tokenURI` would decode to, per
 * `Erc8004RegistrationFile` in the SDK. Built from data we already have —
 * not a live on-chain read (no registered agents exist yet), but the exact
 * shape `getErc8004Agent()` + `decodeErc8004AgentUri()` would hand back.
 */
export function buildRegistrationRecord(agent: Agent): AgentRegistrationRecord {
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: agent.name,
    description: agent.description,
    services: agent.capabilities.map((capability) => ({
      name: capability,
      endpoint: "bnb-agent-studio://" + agent.slug,
    })),
    registrations: [
      {
        agentId: agent.agentId,
        agentRegistry: `eip155:${IDENTITY_CHAIN_ID}:${getIdentityRegistryAddress()}`,
      },
    ],
  };
}
