import { parseEther, parseUnits } from "viem";

import type { Agent, HireSession } from "@/lib/types";

/**
 * Altana integration layer — grounded in @altananetwork/sdk v0.8.0 (see the
 * package's own .d.ts files, the source of truth here, not docs prose).
 *
 * Everything below is real:
 *
 *  1. Hiring wallet creation. `client.createPasskeyWallet()` is a real,
 *     working browser API (WebAuthn) — it needs no funds and no backend.
 *     If it fails (no WebAuthn support, user cancels), hiring is BLOCKED —
 *     no fake wallet gets minted to paper over it. Note: the SDK's own
 *     source comments mention a planned `signerFromInjected` (MetaMask/
 *     Rabby/EIP-1193) signer for a "Connect Wallet" flow, but as of v0.8.0
 *     it is documented only — not implemented or exported. Passkey is the
 *     only browser-native signer actually shipped, which is why hiring
 *     uses a separate Altana wallet rather than the wagmi wallet connected
 *     in the header.
 *
 *  2. Funding. `hireErc8183Agent` is the SDK's real buyer entrypoint — the
 *     five-call atomic batch (createJob, registerJob, setBudget, approve
 *     $U, fund) via the relay. Before calling it, `checkFunding` reads the
 *     wallet's real on-chain $U balance (`client.balances`) so an
 *     underfunded wallet is stopped with an honest "fund this address"
 *     message instead of a fabricated success.
 *
 *  3. The ERC-8183 job shape and status enum (`Erc8183Job` / `JOB_STATUS` /
 *     `HireAgentParams`) are the SDK's real types.
 *
 * Network: BNB Testnet (97) throughout, matching lib/erc8004.ts and
 * lib/wagmi.ts. BNB testnet explorer is used to link a funded job's real transaction.
 */

import {
  createClient,
  BNB_TESTNET,
  ERC8183_ADDRESSES,
  erc8183Addresses,
  getErc8183DeliverableUrl,
  getErc8183Job,
  hireErc8183Agent,
  signerFromPasskey,
  type PasskeyCredential,
  type Signer,
} from "@altananetwork/sdk";

// Patch BSC Testnet (97) policy address to the active whitelisted OptimisticPolicy contract on testnet
if (ERC8183_ADDRESSES[97]) {
  ERC8183_ADDRESSES[97].policy = "0xd6a4217588F6B1F5657a92A3e94E6422aD771cEA" as `0x${string}`;
}

const WALLET_STORAGE_KEY = "hevolaunch:altana-wallet";

/** $U's real ERC-20 contract address on BNB Testnet, read from the SDK's own registry. */
export const PAYMENT_TOKEN_ADDRESS = erc8183Addresses(BNB_TESTNET.chainId).paymentToken;
const PAYMENT_TOKEN = PAYMENT_TOKEN_ADDRESS;

/** Real BNB testnet faucet for getting tBNB */
export const TESTNET_GAS_FAUCET_URL = "https://testnet.bnbchain.org/faucet-smart";

/**
 * Real testnet faucet for $U itself (not gas) — confirmed against the
 * bnbagent-studio docs, whose listed BSC-testnet $U contract address
 * matches the SDK's PAYMENT_TOKEN_ADDRESS.
 */
export const TESTNET_U_FAUCET_URL = "https://united-coin-u.github.io/u-faucet/";

export interface StoredHiringWallet {
  address: `0x${string}`;
  credential: PasskeyCredential;
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
    if (raw) return JSON.parse(raw) as StoredHiringWallet;

    // Fallback: If no account-specific wallet found, check legacy global key
    const legacyRaw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as StoredHiringWallet;
      if (account && parsed) {
        window.localStorage.setItem(key, legacyRaw);
      }
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

/**
 * Creates (or loads) the browser's Altana hiring wallet via
 * `client.createPasskeyWallet({ name: "HevoLaunch" })` — a real WebAuthn
 * ceremony returning a counterfactual smart-account address plus a
 * `PasskeyCredential`, persisted so the same wallet rehydrates via
 * `signerFromPasskey` on the next visit.
 */
export async function createOrLoadHiringWallet(account?: string): Promise<CreateHiringWalletResult> {
  const existing = getStoredHiringWallet(account);
  if (existing) {
    try {
      const signer = signerFromPasskey(existing.credential);
      return { ok: true, wallet: existing, signer };
    } catch (err) {
      console.warn("[altana] Failed to load existing wallet:", err);
      // Continue to create new wallet if loading fails
    }
  }

  return createFreshHiringWallet(account);
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
    return "Passkey prompt was cancelled or timed out. Please try again.";
  }
  if (
    lower.includes("no passkey") ||
    lower.includes("not found") ||
    lower.includes("no keys registered") ||
    lower.includes("unknown account")
  ) {
    return "No existing passkey for HevoLaunch was found on this device. Please create a new hiring passkey.";
  }
  if (lower.includes("invalidstateerror")) {
    return "A passkey is already registered or the session state was invalid. Please create a fresh passkey.";
  }
  if (lower.includes("notsupportederror") || lower.includes("not supported")) {
    return "Passkeys are not supported on this browser or platform. Please use Chrome, Edge, Safari, or Brave with biometrics or a security key.";
  }
  return msg;
}

/**
 * Creates a brand new passkey hiring wallet by clearing any existing local
 * storage and running a fresh WebAuthn ceremony + EIP-7702 upgrade registration
 * on the Altana relay.
 */
export async function createFreshHiringWallet(account?: string): Promise<CreateHiringWalletResult> {
  clearStoredHiringWallet(account);
  try {
    const altana = getAltanaClient();
    const result = await altana.createPasskeyWallet({ name: "HevoLaunch" });
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
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
 * Recovers a hiring wallet created on a DIFFERENT browser/device — the
 * `localStorage` lookup above only ever finds a wallet on the exact browser
 * that created it, which is a dead end if that storage gets cleared or the
 * user switches machines. `client.recoverFromPasskey()` is the SDK's real
 * fix for exactly this: the OS shows every passkey saved for this site, the
 * user picks theirs, and the SDK rebuilds the same wallet from on-chain
 * KeyStore data (the wallet address is baked into the passkey credential's
 * userHandle at creation time).
 */
export async function recoverHiringWallet(account?: string): Promise<CreateHiringWalletResult> {
  try {
    const altana = getAltanaClient();
    const result = await altana.recoverFromPasskey({});
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
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
 * Minimum native tBNB the hiring wallet needs. The relay sponsors the
 * ERC-8183 kernel writes themselves, but NOT the ERC-20 `approve` call
 * `fund` sends when the token allowance is too low (typically just the
 * first fund) — confirmed against bnbagent-studio's own buyer-prerequisite
 * docs ("Wallet has ≥ 0.05 tBNB (gas)..."). A wallet with plenty of $U but
 * zero tBNB fails this exact step with an unhelpful bare on-chain revert.
 */
const MIN_GAS_WEI = parseEther("0.002");

export interface FundingCheck {
  funded: boolean;
  balanceRaw: bigint;
  requiredRaw: bigint;
  nativeBalanceRaw: bigint;
  hasGas: boolean;
}

/** Reads the wallet's real on-chain $U and tBNB balances before attempting to fund a job. */
export async function checkFunding(
  wallet: StoredHiringWallet,
  requiredRaw: bigint
): Promise<FundingCheck> {
  const altana = getAltanaClient();
  const result = await altana.balances({
    wallet,
    tokens: [PAYMENT_TOKEN],
    chainId: BNB_TESTNET.chainId,
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
      { network: BNB_TESTNET }
    );

    const funded: HireSession = {
      ...session,
      jobId: result.jobId.toString(),
      txHash: result.transactionHash,
      status: "FUNDED",
      error: undefined,
      updatedAt: Date.now(),
    };

    // Asynchronously notify the agent runtime over A2A
    try {
      const slug = session.agentSlug || session.agentCategory || "rebalance";
      const route = slug.toLowerCase().includes("grid")
        ? "grid"
        : slug.toLowerCase().includes("yield")
          ? "yield"
          : slug.toLowerCase().includes("sentinel") || slug.toLowerCase().includes("health")
            ? "sentinel"
            : "rebalance";

      fetch(`https://hevo-agents.fly.dev/${route}/a2a`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "message/send",
          params: {
            data: {
              skill: "notify_funded",
              job_id: Number(result.jobId),
              task: session.task,
              hirer: wallet.address,
            },
          },
        }),
      }).catch((e) => console.warn("[A2A notify_funded] warning:", e));
    } catch {
      // Non-blocking notification
    }

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

/** Real BscScan testnet link for a funded job's transaction. */
export function explorerTxUrl(txHash: string): string {
  return `https://testnet.bscscan.com/tx/${txHash}`;
}

/**
 * Reads a funded job's real current status straight from the ERC-8183
 * kernel on-chain — no simulation. Once the seller submits a deliverable,
 * also resolves its real URL via `getErc8183DeliverableUrl`.
 */
export async function refreshJobStatus(session: HireSession): Promise<HireSession> {
  if (!session.jobId) return session;

  try {
    const job = await getErc8183Job(BNB_TESTNET, BigInt(session.jobId));
    const updated: HireSession = {
      ...session,
      status: job.statusName,
      error: undefined,
      updatedAt: Date.now(),
    };

    if (job.statusName === "SUBMITTED" || job.statusName === "COMPLETED") {
      updated.deliverableUrl = await getErc8183DeliverableUrl(BNB_TESTNET, BigInt(session.jobId));
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
