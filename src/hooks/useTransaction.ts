import { useState, useCallback } from "react";
import { submitTransaction } from "@/services/api";
import { useWalletStore } from "@/store/walletStore";
import * as freighter from "@/wallet/freighter";

export type TxState =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

interface UseTransactionResult {
  state: TxState;
  txHash: string | null;
  error: string | null;
  execute: (buildFn: () => Promise<{ xdr: string }>) => Promise<void>;
  reset: () => void;
}

export function useTransaction(): UseTransactionResult {
  const [state, setState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const network = useWalletStore((s) => s.network);

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (buildFn: () => Promise<{ xdr: string }>) => {
      setState("building");
      setTxHash(null);
      setError(null);

      try {
        // Step 1: Build unsigned XDR via API
        const { xdr } = await buildFn();

        // Step 2: Sign with Freighter
        setState("signing");
        const signedXdr = await freighter.sign(xdr, network);
        if (!signedXdr) {
          throw new Error("Transaction signing was cancelled or failed.");
        }

        // Step 3: Submit to network
        setState("submitting");
        const { txHash: hash } = await submitTransaction(signedXdr);

        setTxHash(hash);
        setState("success");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
        setState("error");
      }
    },
    [network]
  );

  return { state, txHash, error, execute, reset };
}
