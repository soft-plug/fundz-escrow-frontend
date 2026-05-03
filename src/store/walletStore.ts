import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkType = "testnet" | "mainnet" | "unknown";

interface WalletState {
  address: string | null;
  network: NetworkType;
  connected: boolean;
  connecting: boolean;
  setAddress: (address: string | null) => void;
  setNetwork: (network: NetworkType) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      network: "unknown",
      connected: false,
      connecting: false,
      setAddress: (address) => set({ address }),
      setNetwork: (network) => set({ network }),
      setConnected: (connected) => set({ connected }),
      setConnecting: (connecting) => set({ connecting }),
      disconnect: () =>
        set({ address: null, connected: false, network: "unknown" }),
    }),
    {
      name: "wallet-store",
      // Only persist address + network, not transient UI state
      partialize: (state) => ({
        address: state.address,
        network: state.network,
        connected: state.connected,
      }),
    }
  )
);
