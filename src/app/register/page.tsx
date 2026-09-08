"use client";

import { useState } from "react";
import { keccak256, toBytes } from "viem";
import { bsc } from "wagmi/chains";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { getIdentityRegistryAddress } from "@/lib/erc8004";

const REGISTRY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentURI", type: "string" },
      {
        name: "metadata",
        type: "tuple[]",
        components: [
          { name: "metadataKey", type: "string" },
          { name: "metadataValue", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "setAgentURI",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newURI", type: "string" },
    ],
    outputs: [],
  },
] as const;

const REGISTERED_TOPIC = keccak256(toBytes("Registered(uint256,string,address)"));

function encodeRegistration(value: object) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:application/json;base64,${btoa(binary)}`;
}

function findAgentId(logs: readonly { address: string; topics: readonly string[] }[], owner: string) {
  const registry = getIdentityRegistryAddress().toLowerCase();
  const normalizedOwner = owner.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const log = logs.find(
    (entry) =>
      entry.address.toLowerCase() === registry &&
      entry.topics[0]?.toLowerCase() === REGISTERED_TOPIC.toLowerCase() &&
      entry.topics[2]?.toLowerCase() === `0x${normalizedOwner}`
  );
  if (!log?.topics[1]) throw new Error("The registration receipt did not contain a matching agent ID.");
  return BigInt(log.topics[1]);
}

export default function RegisterAgentPage() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: bsc.id });
  const { writeContractAsync, isPending } = useWriteContract();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState<string>();

  async function register() {
    if (!address) throw new Error("Connect a wallet first.");
    if (walletChainId !== bsc.id) {
      switchChain({ chainId: bsc.id });
      throw new Error("Switch your wallet to BNB Smart Chain Mainnet, then retry.");
    }
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("The agent endpoint must use HTTPS.");
    if (!url.pathname.endsWith("/.well-known/agent-card.json")) {
      throw new Error("Use the agent's full /.well-known/agent-card.json URL.");
    }

    setStatus("Checking agent card...");
    const verification = await fetch("/api/verify-agent-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    const verificationResult = (await verification.json()) as {
      error?: string;
      protocolVersion?: string;
    };
    if (!verification.ok) throw new Error(verificationResult.error ?? "Endpoint verification failed.");

    const registry = getIdentityRegistryAddress();
    const initialRecord = {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name,
      description,
      services: [{ name: "A2A", endpoint: endpoint.toString(), version: verificationResult.protocolVersion ?? "0.3.0" }],
      registrations: [],
    };

    setStatus("Approve the ERC-8004 identity mint in your wallet...");
    const mintHash = await writeContractAsync({
      address: registry,
      abi: REGISTRY_ABI,
      functionName: "register",
      args: [encodeRegistration(initialRecord), []],
      chainId: bsc.id,
    });
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: mintHash });
    const mintedId = findAgentId(receipt.logs, address);
    setTokenId(mintedId.toString());

    const finalRecord = {
      ...initialRecord,
      registrations: [{ agentId: Number(mintedId), agentRegistry: `eip155:56:${registry}` }],
    };
    setStatus("Approve the completed metadata update in your wallet...");
    await writeContractAsync({
      address: registry,
      abi: REGISTRY_ABI,
      functionName: "setAgentURI",
      args: [mintedId, encodeRegistration(finalRecord)],
      chainId: bsc.id,
    });
    setStatus(`Registered ERC-8004 agent #${mintedId.toString()}.`);
  }

  return (
    <div className="page-wrap max-w-2xl py-12 space-y-6">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">Provider registration</p>
        <h1 className="font-heading text-3xl font-bold">Register an agent identity</h1>
        <p className="text-sm text-muted-foreground">
          Deploy and verify your agent endpoint first. Your connected wallet will own the ERC-8004 identity and approve both mainnet transactions.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Agent name</span>
          <input className="w-full rounded-md border bg-background px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Description</span>
          <textarea className="w-full rounded-md border bg-background px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">A2A agent-card endpoint</span>
          <input className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs" placeholder="https://your-agent.example/.well-known/agent-card.json" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} required />
        </label>

        {!isConnected ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Connect your wallet from the header to continue.</p>
        ) : walletChainId !== bsc.id ? (
          <Button onClick={() => switchChain({ chainId: bsc.id })}>Switch to BNB Mainnet</Button>
        ) : (
          <Button onClick={() => void register().catch((error: unknown) => setStatus(error instanceof Error ? error.message : String(error)))} disabled={isPending || !name || !description || !endpoint}>
            {isPending ? "Waiting for wallet..." : "Register on BNB Mainnet"}
          </Button>
        )}
        {status && (
          <p className="max-w-full break-words text-sm text-muted-foreground">
            {status}
          </p>
        )}
        {tokenId && <a className="text-sm text-primary hover:underline" href={`https://8004scan.io/agents/bsc/${tokenId}`} target="_blank" rel="noreferrer">View agent #{tokenId} on 8004scan</a>}
      </div>
    </div>
  );
}
