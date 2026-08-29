import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Wallet config for BNB Smart Chain. Testnet is included alongside mainnet
 * since agent hiring will be tested against testnet before going live.
 * Only the injected connector (MetaMask / browser wallet) is wired up for
 * now — WalletConnect needs a project ID we don't have yet, and can be
 * added later without touching anything else here.
 *
 * Testnet uses an explicit RPC rather than wagmi's chain default — that
 * default resolves to a shared third-party aggregator (routeme.sh) that
 * rate-limits fast under real use (429 "exceeded maximum retry limit").
 * `bsc-testnet-rpc.publicnode.com` is the same endpoint @altananetwork/sdk's
 * own BNB_TESTNET config uses (lib/altana.ts), already verified working.
 */
export const wagmiConfig = createConfig({
  // Testnet first — that is the chain hiring actually uses. wagmi treats
  // the first chain as the default; listing mainnet first made the header
  // wallet look "correct" on 56 while every hire runs on 97.
  chains: [bscTestnet, bsc],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http("https://bsc-testnet-rpc.publicnode.com"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
