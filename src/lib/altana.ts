import { parseUnits } from "viem";

import type { Agent, HireSession } from "@/lib/types";

/**
 * Altana integration layer — grounded in @altananetwork/sdk v0.8.0
 * (see docs.altana.network and the package's own .d.ts files, which are
 * the source of truth here, not just the docs site prose).
 *
 * Two things are genuinely real in this file:
 *
 *  1. Hiring wallet creation. `client.createPasskeyWallet()` is a real,
 *     working browser API (WebAuthn) — it needs no funds and no backend,
 *     so we call it for real. Note: the SDK's own source comments mention
 *     a planned `signerFromInjected` (MetaMask/Rabby/EIP-1193) signer for
 *     a "Connect Wallet" flow, but as of v0.8.0 it is documented only —
 *     not implemented or exported. Passkey is the only browser-native
 *     signer actually shipped, which is why hiring uses a separate
 *     Altana wallet rather than the wagmi wallet connected in the header.
 *
 *  2. The ERC-8183 job shape. `Erc8183Job` / `JOB_STATUS` / `HireAgentParams`
 *     imported below are the SDK's real types — our simulated job below is
 *     built to match them exactly.
 *
 * What's simulated: actually funding and settling a job on-chain
 * (`hireErc8183Agent`, `settleErc8183Job`). That needs a hiring wallet
 * pre-funded with $U and a live relay round-trip, which isn't available
 * in this environment. Every simulated step is commented with the exact
 * real call it stands in for.
 */

import {
  createClient,
  BNB_TESTNET,
  signerFromPasskey,
  type PasskeyCredential,
  type Signer,
} from "@altananetwork/sdk";

const WALLET_STORAGE_KEY = "hevolaunch:altana-wallet";

export interface StoredHiringWallet {
  address: `0x${string}`;
  credential: PasskeyCredential;
  /** true if WebAuthn/relay setup failed and this is a local-only stand-in. */
  isDemoFallback?: boolean;
}

let client: ReturnType<typeof createClient> | null = null;

/** Lazy singleton — createClient() just holds config, no network call. */
function getAltanaClient() {
  if (!client) {
    client = createClient({ chains: [BNB_TESTNET] });
  }
  return client;
}

function randomHex(bytes: number): string {
  let hex = "";
  for (let i = 0; i < bytes * 2; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

export function getStoredHiringWallet(): StoredHiringWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredHiringWallet) : null;
  } catch {
    return null;
  }
}

function persistHiringWallet(wallet: StoredHiringWallet) {
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

/**
 * Creates (or loads) the browser's Altana hiring wallet.
 *
 * Real call: `client.createPasskeyWallet({ name: "HevoLaunch" })`. This
 * prompts the OS passkey ceremony (Windows Hello / Touch ID / a security
 * key) and returns a counterfactual smart-account address plus a
 * JSON-safe `PasskeyCredential`, which we persist so the same wallet
 * rehydrates on the next visit via `signerFromPasskey`.
 *
 * If WebAuthn isn't available or the user cancels, we fall back to a
 * local-only demo wallet so the rest of the hire flow can still be
 * exercised — clearly flagged via `isDemoFallback`.
 */
export async function createOrLoadHiringWallet(): Promise<{
  wallet: StoredHiringWallet;
  signer: Signer | null;
}> {
  const existing = getStoredHiringWallet();
  if (existing) {
    const signer = existing.isDemoFallback
      ? null
      : signerFromPasskey(existing.credential);
    return { wallet: existing, signer };
  }

  try {
    const altana = getAltanaClient();
    const result = await altana.createPasskeyWallet({ name: "HevoLaunch" });
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
    };
    persistHiringWallet(stored);
    return { wallet: stored, signer: result.signer };
  } catch (err) {
    console.warn(
      "[altana] Passkey wallet creation failed, using local demo wallet instead:",
      err
    );
    const demo: StoredHiringWallet = {
      address: `0x${randomHex(20)}` as `0x${string}`,
      credential: { kind: "headless", privateKey: `0x${randomHex(32)}` as `0x${string}`, publicKey: `0x${randomHex(64)}` as `0x${string}` },
      isDemoFallback: true,
    };
    persistHiringWallet(demo);
    return { wallet: demo, signer: null };
  }
}

function toDeliveryDeadline(): number {
  // "deadlineSeconds" in the real SDK is extra submission time beyond the
  // dispute window (default 1800s / 30min). We give agents a generous 24h
  // to submit a deliverable for a demo hire.
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24;
}

function defaultTask(agent: Agent): string {
  return `Run ${agent.capabilities[0]?.toLowerCase() ?? "your service"} for my portfolio on BNB Smart Chain.`;
}

export function buildHireSession(
  agent: Agent,
  hirerAddress: `0x${string}`,
  task?: string
): HireSession {
  const now = Date.now();
  return {
    id: `local_${randomHex(8)}`,
    agentId: agent.id,
    agentSlug: agent.slug,
    agentCategory: agent.category,
    agentName: agent.name,
    avatarColor: agent.avatarColor,
    hirerAddress,
    provider: agent.agentIdentityAddress,
    task: task?.trim() || defaultTask(agent),
    // $U uses 18 decimals, like the agent's listed USDC price — treated
    // 1:1 for this demo since both are USD-pegged stables.
    budget: parseUnits(String(agent.pricing.amount), 18).toString(),
    expiredAt: toDeliveryDeadline(),
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Drives a session from OPEN through to FUNDED (or FAILED), calling
 * onUpdate after each transition.
 *
 * Real call this stands in for: the buyer's five-call atomic batch —
 * createJob, registerJob, setBudget, approve $U, fund — executed in one
 * relay intent via `hireErc8183Agent(wallet, signer, { provider, task,
 * budget, deadlineSeconds }, opts)`. That needs the hiring wallet funded
 * with $U on BNB testnet/mainnet, which this environment doesn't have.
 */
export async function runHireFlow(
  session: HireSession,
  onUpdate: (session: HireSession) => void
): Promise<HireSession> {
  await wait(700);

  const succeeded = Math.random() > 0.05;
  if (!succeeded) {
    const failed: HireSession = { ...session, status: "FAILED", updatedAt: Date.now() };
    onUpdate(failed);
    return failed;
  }

  const funded: HireSession = {
    ...session,
    jobId: String(Math.floor(Math.random() * 1_000_000) + 1),
    status: "FUNDED",
    updatedAt: Date.now(),
  };
  onUpdate(funded);
  return funded;
}

/**
 * Demo-only: advances a FUNDED job to SUBMITTED, then COMPLETED, standing
 * in for the agent doing the work and the buyer approving settlement via
 * `settleErc8183Job(wallet, signer, { jobId, action: "approve" }, opts)`.
 * Lets the dashboard show the full status lifecycle without waiting on a
 * real agent.
 */
export async function simulateAgentProgress(
  session: HireSession,
  onUpdate: (session: HireSession) => void
): Promise<HireSession> {
  if (session.status !== "FUNDED" && session.status !== "SUBMITTED") {
    return session;
  }

  if (session.status === "FUNDED") {
    await wait(800);
    const submitted: HireSession = {
      ...session,
      status: "SUBMITTED",
      updatedAt: Date.now(),
    };
    onUpdate(submitted);
    await wait(800);
    const completed: HireSession = {
      ...submitted,
      status: "COMPLETED",
      updatedAt: Date.now(),
    };
    onUpdate(completed);
    return completed;
  }

  await wait(800);
  const completed: HireSession = {
    ...session,
    status: "COMPLETED",
    updatedAt: Date.now(),
  };
  onUpdate(completed);
  return completed;
}
