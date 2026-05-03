import { useState, useEffect } from "react";
import {
  getEscrowsByBuyer,
  getEscrowsBySeller,
  getEscrowsByArbitrator,
} from "@/services/api";
import type { Escrow } from "@/types/escrow";

interface UseEscrowListResult {
  escrows: Escrow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEscrowList(address: string | null): UseEscrowListResult {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address) {
      setEscrows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getEscrowsByBuyer(address),
      getEscrowsBySeller(address),
      getEscrowsByArbitrator(address),
    ])
      .then(([asBuyer, asSeller, asArbitrator]) => {
        if (cancelled) return;
        // Deduplicate by escrowId
        const seen = new Set<string>();
        const all: Escrow[] = [];
        for (const e of [...asBuyer, ...asSeller, ...asArbitrator]) {
          if (!seen.has(e.escrowId)) {
            seen.add(e.escrowId);
            all.push(e);
          }
        }
        // Sort newest first
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEscrows(all);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load escrows"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, tick]);

  return {
    escrows,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
