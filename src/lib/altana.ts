import { parseEther, parseUnits } from "viem";

import type { Agent, HireSession } from "@/lib/types";

import {
  createClient,
  BNB,
  erc8183Addresses,
  getErc8183DeliverableUrl,
  getErc8183Job,
  hireErc8183Agent,
  signerFromPasskey,
  type PasskeyCredential,
  type Signer,
} from "@altananetwork/sdk";

export const ACTIVE_NETWORK = BNB;

const WALLET_STORAGE_KEY = "hevolaunch:altana-wallet";

/** $U's real ERC-20 contract address on BNB Smart Chain Mainnet, read from the SDK's own registry. */
export const PAYMENT_TOKEN_ADDRESS = erc8183Addresses(BNB.chainId).paymentToken;
const PAYMENT_TOKEN = PAYMENT_TOKEN_ADDRESS;

export interface StoredHiringWallet {
  address: `0x${string}`;
  credential: PasskeyCredential;
  type?: "passkey";
}

let client: ReturnType<typeof createClient> | null = null;

/** Lazy singleton — createClient() just holds config, no network call. */
function getAltanaClient() {
  if (!client) {
    client = createClient({ chains: [BNB] });
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

function getWalletStorageKey(account?: string): string {
  return account
    ? `${WALLET_STORAGE_KEY}:${account.toLowerCase()}`
    : `${WALLET_STORAGE_KEY}:default`;
}

export function getStoredHiringWallet(account?: string): StoredHiringWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getWalletStorageKey(account);
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredHiringWallet & { privateKey?: string };
      if (parsed.privateKey || !parsed.credential) {
        window.localStorage.removeItem(key);
        return null;
      }
      return parsed;
    }

    // Fallback: If no account-specific wallet found, check legacy global key
    const legacyRaw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as StoredHiringWallet & { privateKey?: string };
      if (parsed.privateKey) {
        window.localStorage.removeItem(WALLET_STORAGE_KEY);
        window.localStorage.removeItem(key);
        return null;
      }
      if (!parsed.credential) return null;
      if (account) window.localStorage.setItem(key, legacyRaw);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function persistHiringWallet(wallet: StoredHiringWallet, account?: string) {
  const key = getWalletStorageKey(account);
  window.localStorage.setItem(key, JSON.stringify(wallet));
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

export type CreateHiringWalletResult =
  | { ok: true; wallet: StoredHiringWallet; signer: Signer }
  | { ok: false; error: string };

export function clearStoredHiringWallet(account?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getWalletStorageKey(account);
    window.localStorage.removeItem(key);
    if (!account) {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    }
  } catch (err) {
    console.warn("[altana] Failed to clear stored wallet:", err);
  }
}

function formatPasskeyError(err: unknown, action: "create" | "recover"): string {
  if (!err) return "Passkey operation was not completed.";
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (
    lower.includes("notallowederror") ||
    lower.includes("cancelled") ||
    lower.includes("canceled") ||
    lower.includes("timed out") ||
    lower.includes("abort")
  ) {
    return "Passkey prompt was cancelled or timed out. Try again, or restore an existing hiring wallet.";
  }
  if (
    lower.includes("no passkey") ||
    lower.includes("not found") ||
    lower.includes("no keys registered") ||
    lower.includes("unknown account")
  ) {
    return "No hiring-wallet passkey for HevoLaunch was found on this device. Create one with Windows Hello, Touch ID, or a security key.";
  }
  if (lower.includes("invalidstateerror")) {
    return "A passkey is already registered or the session state was invalid. Restore the existing hiring wallet, or create a new one.";
  }
  if (lower.includes("notsupportederror") || lower.includes("not supported")) {
    return "Passkeys are not supported in this browser. Use a current Chrome, Edge, or Safari build.";
  }
  return msg;
}

/**
 * Creates a brand new passkey hiring wallet via WebAuthn biometric ceremony.
 */
export async function createFreshPasskeyWallet(account?: string): Promise<CreateHiringWalletResult> {
  clearStoredHiringWallet(account);
  try {
    const altana = getAltanaClient();
    const result = await altana.createPasskeyWallet({ name: "HevoLaunch" });
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
      type: "passkey",
    };
    persistHiringWallet(stored, account);
    return { ok: true, wallet: stored, signer: result.signer };
  } catch (err) {
    console.warn("[altana] Fresh passkey wallet creation failed:", err);
    return {
      ok: false,
      error: formatPasskeyError(err, "create"),
    };
  }
}

/**
 * Creates or loads the browser's Altana hiring wallet.
 * Only a passkey credential is accepted. A leftover localStorage private
 * key from an earlier build is wiped, not reused.
 */
export async function createOrLoadHiringWallet(account?: string): Promise<CreateHiringWalletResult> {
  const existing = getStoredHiringWallet(account);
  if (existing?.credential) {
    try {
      return { ok: true, wallet: existing, signer: signerFromPasskey(existing.credential) };
    } catch (err) {
      console.warn("[altana] Failed to load existing wallet:", err);
    }
  }
  return {
    ok: false,
    error: "No hiring wallet on this device yet. Create one with a passkey.",
  };
}

export const createFreshHiringWallet = createFreshPasskeyWallet;

/**
 * Recovers a passkey-backed hiring wallet from on-chain KeyStore data.
 */
export async function recoverHiringWallet(account?: string): Promise<CreateHiringWalletResult> {
  try {
    const altana = getAltanaClient();
    const result = await altana.recoverFromPasskey({});
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
      type: "passkey",
    };
    persistHiringWallet(stored, account);
    return { ok: true, wallet: stored, signer: result.signer };
  } catch (err) {
    console.warn("[altana] Passkey wallet recovery failed:", err);
    return {
      ok: false,
      error: formatPasskeyError(err, "recover"),
    };
  }
}

function toDeliveryDeadline(): number {
  // Absolute unix seconds this hire session's escrow deadline sits at —
  // converted to the SDK's relative `deadlineSeconds` at fund time.
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24;
}

function defaultTask(agent: Agent): string {
  return `Run ${agent.capabilities[0]?.toLowerCase() ?? "your service"} for my portfolio on BNB Smart Chain.`;
}

export function buildHireSession(
  agent: Agent,
  hirerAddress: `0x${string}`,
  task?: string,
  connectedAddress?: `0x${string}`
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
    connectedAddress,
    provider: agent.agentIdentityAddress,
    task: task?.trim() || defaultTask(agent),
    // $U uses 18 decimals, like the agent's listed USDC price — treated
    // 1:1 since both are USD-pegged stables.
    budget: parseUnits(String(agent.pricing.amount), 18).toString(),
    expiredAt: toDeliveryDeadline(),
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Minimum native BNB the hiring wallet needs on mainnet. The relay
 * sponsors the ERC-8183 kernel writes, but not the ERC-20 `approve`
 * when allowance is missing.
 */
const MIN_GAS_WEI = parseEther("0.002");

export interface FundingCheck {
  funded: boolean;
  balanceRaw: bigint;
  requiredRaw: bigint;
  nativeBalanceRaw: bigint;
  hasGas: boolean;
}

/** Reads the wallet's real on-chain $U and BNB balances before attempting to fund a job. */
export async function checkFunding(
  wallet: StoredHiringWallet,
  requiredRaw: bigint
): Promise<FundingCheck> {
  const altana = getAltanaClient();
  const result = await altana.balances({
    wallet,
    tokens: [PAYMENT_TOKEN],
    chainId: BNB.chainId,
  });
  const token = result.tokens?.[0];
  const balanceRaw = token && token.ok ? token.raw : BigInt(0);
  const nativeBalanceRaw = result.native;
  const hasGas = nativeBalanceRaw >= MIN_GAS_WEI;
  return {
    funded: balanceRaw >= requiredRaw && hasGas,
    balanceRaw,
    requiredRaw,
    nativeBalanceRaw,
    hasGas,
  };
}

/**
 * Funds a job for real via `hireErc8183Agent` — the buyer's five-call
 * atomic batch (createJob, registerJob, setBudget, approve $U, fund) in one
 * relay intent. Checks funding first; an underfunded wallet gets stopped
 * with `UNFUNDED`, not a fabricated success. A relay/execute failure
 * becomes `FAILED` with the real error logged.
 */
export async function fundHireSession(
  wallet: StoredHiringWallet,
  signer: Signer,
  session: HireSession,
  onUpdate: (session: HireSession) => void
): Promise<HireSession> {
  const requiredRaw = BigInt(session.budget);
  const check = await checkFunding(wallet, requiredRaw);

  if (!check.funded) {
    const unfunded: HireSession = { ...session, status: "UNFUNDED", error: undefined, updatedAt: Date.now() };
    onUpdate(unfunded);
    return unfunded;
  }

  try {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const deadlineSeconds = Math.max(session.expiredAt - nowSeconds, 60);

    const result = await hireErc8183Agent(
      wallet,
      signer,
      {
        provider: session.provider,
        task: session.task,
        budget: requiredRaw,
        deadlineSeconds,
      },
      { network: BNB }
    );

    const funded: HireSession = {
      ...session,
      jobId: result.jobId.toString(),
      txHash: result.transactionHash,
      status: "FUNDED",
      error: undefined,
      updatedAt: Date.now(),
    };

    onUpdate(funded);
    return funded;
  } catch (err) {
    console.error("[altana] hireErc8183Agent failed:", err);
    let errorMessage = err instanceof Error ? err.message : "The relay could not settle the funding transaction.";
    if (errorMessage.includes("0xc94463e3")) {
      errorMessage = "PolicyNotWhitelisted: Policy contract is not whitelisted on EvaluatorRouter.";
    } else if (errorMessage.includes("0xd76ebd0f")) {
      errorMessage = "JobNotOpen: The created job was not in OPEN status.";
    } else if (errorMessage.toLowerCase().includes("unknown account")) {
      errorMessage = "The Altana relay does not recognize this stored hiring wallet (quotes for unknown accounts are not accepted). Please reset your hiring wallet to register a fresh passkey smart account.";
    }
    const failed: HireSession = {
      ...session,
      status: "FAILED",
      error: errorMessage,
      updatedAt: Date.now(),
    };
    onUpdate(failed);
    return failed;
  }
}

/** Real BscScan mainnet link for a funded job's transaction. */
export function explorerTxUrl(txHash: string): string {
  return `https://bscscan.com/tx/${txHash}`;
}

/**
 * Reads a funded job's real current status straight from the ERC-8183
 * kernel on-chain — no simulation. Once the seller submits a deliverable,
 * also resolves its real URL via `getErc8183DeliverableUrl`.
 */
export async function refreshJobStatus(session: HireSession): Promise<HireSession> {
  if (!session.jobId) return session;

  try {
    const job = await getErc8183Job(BNB, BigInt(session.jobId));
    const updated: HireSession = {
      ...session,
      status: job.statusName,
      error: undefined,
      updatedAt: Date.now(),
    };

    if (job.statusName === "SUBMITTED" || job.statusName === "COMPLETED") {
      updated.deliverableUrl = await getErc8183DeliverableUrl(BNB, BigInt(session.jobId));
    }

    return updated;
  } catch (err) {
    return {
      ...session,
      error: err instanceof Error ? err.message : "Could not read this job from the chain.",
      updatedAt: Date.now(),
    };
  }
}
