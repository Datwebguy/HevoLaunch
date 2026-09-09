"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  LogOut,
  Network,
  Wallet,
} from "lucide-react";
import { bsc } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getNetworkName(chainId: number | undefined) {
  if (chainId === undefined) return "Network unavailable";

  switch (chainId) {
    case bsc.id:
      return "BNB Smart Chain Mainnet";
    case 1:
      return "Ethereum Mainnet";
    case 8453:
      return "Base Mainnet";
    case 137:
      return "Polygon Mainnet";
    case 97:
      return "BNB Smart Chain Testnet";
    default:
      return `Unsupported network (${chainId})`;
  }
}

export function ConnectWalletButton() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending} aria-label={isPending ? "Connecting wallet" : "Connect wallet"}>
            <Wallet />
            <span className="hidden sm:inline">{isPending ? "Connecting..." : "Connect wallet"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Choose a wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connectors.map((connector) => (
            <DropdownMenuItem
              key={connector.uid}
              onSelect={() => connect({ connector })}
            >
              {connector.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const onWrongNetwork = walletChainId !== bsc.id;
  const networkName = getNetworkName(walletChainId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" aria-label={`Connected wallet ${truncateAddress(address)}`}>
          <span
            className={`size-2 rounded-full ${
              onWrongNetwork ? "bg-destructive" : "bg-success"
            }`}
            aria-hidden
          />
          <span className="hidden sm:inline">{truncateAddress(address)}</span>
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="flex items-center gap-1.5">
            {onWrongNetwork ? (
              <AlertCircle className="size-3.5 text-amber-500" />
            ) : (
              <Network className="size-3.5 text-emerald-500" />
            )}
            {networkName}
          </span>
          <span className="mt-0.5 block font-normal text-muted-foreground">
            {onWrongNetwork
              ? "Switch networks to use HevoLaunch"
              : "Connected to BNB Smart Chain"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy address"}
        </DropdownMenuItem>
        {onWrongNetwork && (
          <DropdownMenuItem
            onSelect={() => switchChain({ chainId: bsc.id })}
            className="font-medium text-primary focus:text-primary"
          >
            <Network />
            Switch to BNB Mainnet
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => disconnect()}>
          <LogOut />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
