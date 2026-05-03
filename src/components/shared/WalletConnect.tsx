"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import * as freighter from "@/wallet/freighter";

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function WalletConnect() {
  const { address, connected, connecting, connect, disconnect } = useWallet();
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    freighter.isInstalled().then(setInstalled);
  }, []);

  // Still checking
  if (installed === null) {
    return (
      <div className="h-9 w-36 bg-gray-100 animate-pulse rounded-lg" />
    );
  }

  // Freighter not installed
  if (!installed) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Install Freighter
      </a>
    );
  }

  // Connected
  if (connected && address) {
    return (
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={disconnect}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        {hovered ? "Disconnect" : truncate(address)}
      </button>
    );
  }

  // Not connected
  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {connecting ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
