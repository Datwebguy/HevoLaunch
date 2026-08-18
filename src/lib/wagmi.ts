import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Wallet config for BNB Smart Chain. Testnet is included alongside mainnet
 * since agent hiring will be tested against testnet before going live.
 * Only the injected connector (MetaMask / browser wallet) is wired up for
 * now — WalletConnect needs a project ID we don't have yet, and can be
 * added later without touching anything else here.
 */
export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
