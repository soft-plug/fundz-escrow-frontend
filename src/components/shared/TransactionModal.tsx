"use client";

import type { TxState } from "@/hooks/useTransaction";

interface TransactionModalProps {
  state: TxState;
  txHash: string | null;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

const STELLAR_EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

export function TransactionModal({
  state,
  txHash,
  error,
  onClose,
  onRetry,
}: TransactionModalProps) {
  if (state === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Transaction status"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        {/* Building */}
        {state === "building" && (
          <ModalContent
            icon={<Spinner />}
            title="Preparing transaction…"
            subtitle="Building your transaction on the Stellar network."
          />
        )}

        {/* Signing */}
        {state === "signing" && (
          <ModalContent
            icon={<Spinner color="blue" />}
            title="Sign in Freighter"
            subtitle="Check your Freighter wallet extension and approve the transaction."
          />
        )}

        {/* Submitting */}
        {state === "submitting" && (
          <ModalContent
            icon={<Spinner color="indigo" />}
            title="Submitting to network…"
            subtitle="Broadcasting your signed transaction to the Stellar network."
          />
        )}

        {/* Success */}
        {state === "success" && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Transaction submitted</h3>
            {txHash && (
              <a
                href={`${STELLAR_EXPLORER_BASE}/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-500 hover:underline font-mono break-all"
              >
                {txHash.slice(0, 16)}…{txHash.slice(-8)}
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Transaction failed</h3>
            <p className="text-sm text-gray-500 mb-5">{error ?? "An unexpected error occurred."}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalContent({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function Spinner({ color = "gray" }: { color?: string }) {
  const colorMap: Record<string, string> = {
    gray: "text-gray-500",
    blue: "text-blue-500",
    indigo: "text-indigo-500",
  };
  return (
    <svg
      className={`w-7 h-7 animate-spin ${colorMap[color] ?? "text-gray-500"}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
