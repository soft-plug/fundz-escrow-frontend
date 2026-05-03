import { useEffect, useCallback } from "react";
import { useWalletStore } from "@/store/walletStore";
import * as freighter from "@/wallet/freighter";
import type { NetworkType } from "@/store/walletStore";

export function useWallet() {
  const {
    address,
    network,
    connected,
    connecting,
    setAddress,
    setNetwork,
    setConnected,
    setConnecting,
    disconnect: storeDisconnect,
  } = useWalletStore();

  // On mount, check if already connected
  useEffect(() => {
    async function checkConnection() {
      const installed = await freighter.isInstalled();
      if (!installed) return;
      const addr = await freighter.getAddress();
      if (addr) {
        const net = await freighter.getNetwork();
        setAddress(addr);
        setNetwork(net as NetworkType);
        setConnected(true);
      }
    }
    checkConnection();
  }, [setAddress, setNetwork, setConnected]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await freighter.connect();
      if (addr) {
        const net = await freighter.getNetwork();
        setAddress(addr);
        setNetwork(net as NetworkType);
        setConnected(true);
      }
    } finally {
      setConnecting(false);
    }
  }, [setAddress, setNetwork, setConnected, setConnecting]);

  const disconnect = useCallback(() => {
    storeDisconnect();
  }, [storeDisconnect]);

  return { address, network, connected, connecting, connect, disconnect };
}
