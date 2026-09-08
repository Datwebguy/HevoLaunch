import { createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Wallet config for BNB Smart Chain Mainnet (56).
 * Injected connector (MetaMask / browser wallet) connects to BSC Mainnet by default.
 */
export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [injected()],
  transports: {
    // Use Binance's public BSC endpoint. PublicNode's endpoint now requires
    // an Alchemy-style token for some receipt requests.
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
