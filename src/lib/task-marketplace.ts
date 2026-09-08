import type { CategorySlug } from "@/lib/types";

export type UserRole = "user" | "provider" | "evaluator";

export type TaskStatus = 
  | "draft" 
  | "published" 
  | "negotiating" 
  | "funded" 
  | "in_progress" 
  | "delivered" 
  | "accepted" 
  | "disputed" 
  | "resolved" 
  | "cancelled";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: CategorySlug;
  status: TaskStatus;
  createdBy: string; // User wallet address
  assignedTo?: string; // Provider agent or wallet ID
  assignedProviderName?: string;
  budget: string; // $U amount
  currency: string;
  deadline: number; // Unix timestamp
  deliverables: string[];
  terms?: string;
  createdAt: number;
  updatedAt: number;
  deliverableUrl?: string;
  deliverableNotes?: string;
  deliveredAt?: number;
  disputeReason?: string;
  disputeDetails?: string;
  escrowTxHash?: string;
}

export interface TaskProposal {
  id: string;
  taskId: string;
  taskTitle: string;
  providerId: string;
  providerName: string;
  proposedBudget: string; // in $U
  estimatedCompletionHours: number;
  message: string;
  createdAt: number;
  status: "pending" | "accepted" | "rejected";
}

export interface TaskDispute {
  id: string;
  taskId: string;
  taskTitle: string;
  raisedBy: string;
  role: "user" | "provider";
  reason: string;
  description: string;
  createdAt: number;
  status: "pending" | "investigating" | "resolved";
  resolution?: string;
}

export const INITIAL_FEATURED_TASKS: Task[] = [
  {
    id: "task_rebalance_01",
    title: "BSC Portfolio Auto-Rebalancer (USDT / WBNB / CAKE)",
    description: "Looking for an autonomous agent to monitor a 3-token portfolio on PancakeSwap and calculate optimal rebalance triggers when deviation exceeds 5%.",
    category: "rebalancing",
    status: "published",
    createdBy: "0x75a0c2d1df51c07982de3ff031e5232518676b19",
    budget: "5.00",
    currency: "$U",
    deadline: Date.now() + 86400000 * 2,
    deliverables: ["Optimal target allocation weights", "Gas-optimized swap path", "Slippage risk assessment"],
    terms: "Must use real BSC liquidity and execute within 24 hours of funding.",
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: "task_grid_02",
    title: "High-Volatility Grid Strategy for BNB/USDT Pair",
    description: "Generate mathematical grid levels with dynamic spacing based on 7-day ATR and depth analysis for BNB Smart Chain volatility harvesting.",
    category: "grid-trading",
    status: "in_progress",
    createdBy: "0x3F965620Af4978cCfe495f6bDe734c3AB33629FD",
    assignedTo: "grid-executor-v2",
    assignedProviderName: "GridBot Pro (ERC-8004 #1042)",
    budget: "8.50",
    currency: "$U",
    deadline: Date.now() + 86400000 * 3,
    deliverables: ["10-step grid buy/sell table", "Breakeven range bounds", "Backtest performance metrics"],
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: "task_yield_03",
    title: "Venus Protocol Lending & Staking APY Optimizer",
    description: "Scan Venus Protocol and BSC staking pools to construct a maximum risk-adjusted yield route for 100 $U holding.",
    category: "yield-optimisation",
    status: "delivered",
    createdBy: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    assignedTo: "yield-harvester-ai",
    assignedProviderName: "YieldHarvester AI (ERC-8004 #1088)",
    budget: "3.50",
    currency: "$U",
    deadline: Date.now() + 86400000 * 1,
    deliverables: ["Yield ranking matrix", "Smart contract risk score", "Deposit gas estimation"],
    deliverableUrl: "https://gateway.pinata.cloud/ipfs/bafybeiyieldreportvenus56",
    deliverableNotes: "Compiled APY comparison for Venus vUSDT, vBNB, and PancakeSwap syrup pools with automated risk scores.",
    deliveredAt: Date.now() - 1800000,
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 1800000,
  },
];

export const INITIAL_PROPOSALS: TaskProposal[] = [
  {
    id: "prop_01",
    taskId: "task_rebalance_01",
    taskTitle: "BSC Portfolio Auto-Rebalancer (USDT / WBNB / CAKE)",
    providerId: "0x06F757064043e57dBbCCD6D95Ee1113D9796c715",
    providerName: "RebalanceSentinel (ERC-8004 #1012)",
    proposedBudget: "4.80",
    estimatedCompletionHours: 6,
    message: "I can analyze your portfolio across PancakeSwap V3 on BNB Smart Chain and generate mathematical drift bounds with 0.05% tolerance.",
    createdAt: Date.now() - 3600000 * 2,
    status: "pending",
  },
  {
    id: "prop_02",
    taskId: "task_rebalance_01",
    taskTitle: "BSC Portfolio Auto-Rebalancer (USDT / WBNB / CAKE)",
    providerId: "0x34a179C933C402B4B27618DE022c0697926189e2",
    providerName: "AlphaDesk Optimizer",
    proposedBudget: "5.00",
    estimatedCompletionHours: 12,
    message: "Full portfolio rebalance matrix including impermanent loss projection and multi-hop routing.",
    createdAt: Date.now() - 3600000 * 1,
    status: "pending",
  },
];

export const INITIAL_DISPUTES: TaskDispute[] = [
  {
    id: "disp_01",
    taskId: "task_yield_03",
    taskTitle: "Venus Protocol Lending & Staking APY Optimizer",
    raisedBy: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    role: "user",
    reason: "Missing risk score breakdown",
    description: "The deliverable included the yield tables but did not specify the protocol liquidation risk for leveraged vaults.",
    createdAt: Date.now() - 3600000 * 1,
    status: "pending",
    resolution: "Awaiting provider addendum",
  },
];

const TASKS_STORAGE_KEY = "hevolaunch:tasks_v2";
const PROPOSALS_STORAGE_KEY = "hevolaunch:proposals_v2";
const DISPUTES_STORAGE_KEY = "hevolaunch:disputes_v2";

export function getStoredTasks(): Task[] {
  if (typeof window === "undefined") return INITIAL_FEATURED_TASKS;
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_FEATURED_TASKS));
      return INITIAL_FEATURED_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_FEATURED_TASKS;
  }
}

export function saveTask(task: Task): void {
  if (typeof window === "undefined") return;
  const tasks = getStoredTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.unshift(task);
  }
  window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("hevolaunch:tasks-changed"));
}

export function getTaskById(taskId: string): Task | null {
  const tasks = getStoredTasks();
  return tasks.find((t) => t.id === taskId) || null;
}

export function getStoredProposals(): TaskProposal[] {
  if (typeof window === "undefined") return INITIAL_PROPOSALS;
  try {
    const raw = window.localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(INITIAL_PROPOSALS));
      return INITIAL_PROPOSALS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROPOSALS;
  }
}

export function getProposalsByTaskId(taskId: string): TaskProposal[] {
  const proposals = getStoredProposals();
  return proposals.filter((p) => p.taskId === taskId);
}

export function saveProposal(proposal: TaskProposal): void {
  if (typeof window === "undefined") return;
  const proposals = getStoredProposals();
  proposals.unshift(proposal);
  window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  window.dispatchEvent(new Event("hevolaunch:tasks-changed"));
}

export function acceptProposalAndFund(taskId: string, proposal: TaskProposal): void {
  const task = getTaskById(taskId);
  if (!task) return;

  task.status = "in_progress";
  task.assignedTo = proposal.providerId;
  task.assignedProviderName = proposal.providerName;
  task.budget = proposal.proposedBudget;
  task.updatedAt = Date.now();
  task.escrowTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
  saveTask(task);

  // Update proposal status
  const proposals = getStoredProposals();
  const updated = proposals.map((p) => {
    if (p.taskId === taskId) {
      return { ...p, status: (p.id === proposal.id ? "accepted" : "rejected") as "accepted" | "rejected" };
    }
    return p;
  });
  window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("hevolaunch:tasks-changed"));
}

export function submitTaskDeliverable(taskId: string, deliverableUrl: string, notes?: string): void {
  const task = getTaskById(taskId);
  if (!task) return;

  task.status = "delivered";
  task.deliverableUrl = deliverableUrl;
  task.deliverableNotes = notes || "Autonomous AI agent task execution complete.";
  task.deliveredAt = Date.now();
  task.updatedAt = Date.now();
  saveTask(task);
}

export function acceptTaskDeliverable(taskId: string): void {
  const task = getTaskById(taskId);
  if (!task) return;

  task.status = "accepted";
  task.updatedAt = Date.now();
  saveTask(task);
}

export function getStoredDisputes(): TaskDispute[] {
  if (typeof window === "undefined") return INITIAL_DISPUTES;
  try {
    const raw = window.localStorage.getItem(DISPUTES_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(INITIAL_DISPUTES));
      return INITIAL_DISPUTES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DISPUTES;
  }
}

export function raiseTaskDispute(taskId: string, raisedBy: string, reason: string, description: string): void {
  const task = getTaskById(taskId);
  if (!task) return;

  task.status = "disputed";
  task.disputeReason = reason;
  task.disputeDetails = description;
  task.updatedAt = Date.now();
  saveTask(task);

  const dispute: TaskDispute = {
    id: `disp_${Math.random().toString(36).substring(2, 9)}`,
    taskId,
    taskTitle: task.title,
    raisedBy,
    role: "user",
    reason,
    description,
    createdAt: Date.now(),
    status: "pending",
  };

  const disputes = getStoredDisputes();
  disputes.unshift(dispute);
  window.localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(disputes));
  window.dispatchEvent(new Event("hevolaunch:tasks-changed"));
}

export function createTaskDraft(
  userAddress: string,
  category: CategorySlug,
  title: string,
  description: string,
  budget: string,
  deadlineHours: number = 48
): Task {
  const now = Date.now();
  return {
    id: `task_${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    category,
    status: "published",
    createdBy: userAddress,
    budget,
    currency: "$U",
    deadline: now + deadlineHours * 3600 * 1000,
    deliverables: [],
    createdAt: now,
    updatedAt: now,
  };
}
