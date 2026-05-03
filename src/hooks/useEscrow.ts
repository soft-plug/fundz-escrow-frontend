import { useState, useEffect } from "react";
import { getEscrow } from "@/services/api";
import type { Escrow } from "@/types/escrow";

interface UseEscrowResult {
  escrow: Escrow | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEscrow(escrowId: string | null): UseEscrowResult {
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!escrowId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEscrow(escrowId)
      .then((data) => {
        if (!cancelled) setEscrow(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load escrow");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [escrowId, tick]);

  return {
    escrow,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
