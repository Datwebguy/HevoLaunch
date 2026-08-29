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
 * lib/wagmi.ts. `BNB_TESTNET.explorer` (from the SDK, not hardcoded) is
 * used to link a funded job's real transaction on BscScan.
 */

import {
  createClient,
  BNB_TESTNET,
  erc8183Addresses,
  getErc8183DeliverableUrl,
  getErc8183Job,
  hireErc8183Agent,
  signerFromPasskey,
  type PasskeyCredential,
  type Signer,
} from "@altananetwork/sdk";

const WALLET_STORAGE_KEY = "hevolaunch:altana-wallet";

/** $U's real ERC-20 contract address on BNB Testnet, read from the SDK's own registry. */
export const PAYMENT_TOKEN_ADDRESS = erc8183Addresses(BNB_TESTNET.chainId).paymentToken;
const PAYMENT_TOKEN = PAYMENT_TOKEN_ADDRESS;

/** Real BNB testnet faucet, sourced from the SDK's own BNB_TESTNET doc comment. */
export const TESTNET_GAS_FAUCET_URL = "https://testnet.bnbchain.org/faucet-smart";

/**
 * Real testnet faucet for $U itself (not gas) — confirmed against the
 * bnbagent-studio docs, whose listed BSC-testnet $U contract address
 * matches `erc8183Addresses(97).paymentToken` exactly.
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

export type CreateHiringWalletResult =
  | { ok: true; wallet: StoredHiringWallet; signer: Signer }
  | { ok: false; error: string };

/**
 * Creates (or loads) the browser's Altana hiring wallet via
 * `client.createPasskeyWallet({ name: "HevoLaunch" })` — a real WebAuthn
 * ceremony (Windows Hello / Touch ID / a security key) returning a
 * counterfactual smart-account address plus a JSON-safe `PasskeyCredential`,
 * persisted so the same wallet rehydrates via `signerFromPasskey` on the
 * next visit.
 *
 * If WebAuthn is unavailable or the user cancels, hiring is blocked with a
 * real error — this used to fall back to a locally-minted random wallet,
 * which is exactly the kind of thing that looks real but isn't.
 */
export async function createOrLoadHiringWallet(): Promise<CreateHiringWalletResult> {
  const existing = getStoredHiringWallet();
  if (existing) {
    try {
      const signer = signerFromPasskey(existing.credential);
      return { ok: true, wallet: existing, signer };
    } catch (err) {
      console.warn("[altana] Failed to load existing wallet:", err);
      // Continue to create new wallet if loading fails
    }
  }

  try {
    const altana = getAltanaClient();
    const result = await altana.createPasskeyWallet({ name: "HevoLaunch" });
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
    };
    persistHiringWallet(stored);
    return { ok: true, wallet: stored, signer: result.signer };
  } catch (err) {
    console.warn("[altana] Passkey wallet creation failed:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Passkey setup was cancelled or isn't available in this browser.",
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
export async function recoverHiringWallet(): Promise<CreateHiringWalletResult> {
  try {
    const altana = getAltanaClient();
    const result = await altana.recoverFromPasskey({});
    const stored: StoredHiringWallet = {
      address: result.address,
      credential: result.signer.credential,
    };
    persistHiringWallet(stored);
    return { ok: true, wallet: stored, signer: result.signer };
  } catch (err) {
    console.warn("[altana] Passkey wallet recovery failed:", err);
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "No hiring wallet passkey was found for this site on this device.",
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
const MIN_GAS_WEI = parseEther("0.01");

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
    onUpdate(funded);
    return funded;
  } catch (err) {
    console.error("[altana] hireErc8183Agent failed:", err);
    const failed: HireSession = {
      ...session,
      status: "FAILED",
      error: err instanceof Error ? err.message : "The relay could not settle the funding transaction.",
      updatedAt: Date.now(),
    };
    onUpdate(failed);
    return failed;
  }
}

/** Real BscScan testnet link for a funded job's transaction. */
export function explorerTxUrl(txHash: string): string {
  return `${BNB_TESTNET.explorer}/tx/${txHash}`;
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
