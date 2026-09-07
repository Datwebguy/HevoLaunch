import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Wallet config for BNB Smart Chain Mainnet (56).
 * Injected connector (MetaMask / browser wallet) connects to BSC Mainnet by default.
 */
export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [injected()],
  transports: {
    [bsc.id]: http("https://bsc-rpc.publicnode.com"),
    [bscTestnet.id]: http("https://bsc-testnet-rpc.publicnode.com"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
