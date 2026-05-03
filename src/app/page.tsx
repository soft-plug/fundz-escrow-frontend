"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { EscrowCard } from "@/components/escrow/EscrowCard";
import { EscrowEmptyState } from "@/components/escrow/EscrowEmptyState";
import { TransactionModal } from "@/components/shared/TransactionModal";
import { useWallet } from "@/hooks/useWallet";
import { useEscrowList } from "@/hooks/useEscrowList";
import { useTransaction } from "@/hooks/useTransaction";
import { fundEscrow, confirmDelivery, raiseDispute } from "@/services/api";
import { getRole, type Escrow } from "@/types/escrow";

type Tab = "buyer" | "seller";

export default function DashboardPage() {
  const { address, connected } = useWallet();
  const [tab, setTab] = useState<Tab>("buyer");
  const [confirmModal, setConfirmModal] = useState<{
    escrow: Escrow;
    action: string;
  } | null>(null);

  // In Phase 2 we use the real wallet address only.
  // If not connected, show empty state with a connect prompt.
  const effectiveAddress = address ?? null;
  const { escrows, loading, error, refetch } = useEscrowList(effectiveAddress);
  const { state: txState, txHash, error: txError, execute, reset } = useTransaction();

  const buyerEscrows = escrows.filter((e) => e.buyer === effectiveAddress);
  const sellerEscrows = escrows.filter((e) => e.seller === effectiveAddress);
  const displayed = tab === "buyer" ? buyerEscrows : sellerEscrows;

  function handleAction(escrow: Escrow, action: string) {
    if (action === "fund") {
      setConfirmModal({ escrow, action });
    } else if (action === "confirm") {
      setConfirmModal({ escrow, action });
    } else if (action === "raise-dispute") {
      setConfirmModal({ escrow, action });
    }
  }

  async function executeAction() {
    if (!confirmModal) return;
    const { escrow, action } = confirmModal;
    setConfirmModal(null);

    if (action === "fund") {
      await execute(() => fundEscrow(escrow.escrowId));
    } else if (action === "confirm") {
      await execute(() => confirmDelivery(escrow.escrowId));
    } else if (action === "raise-dispute") {
      await execute(() => raiseDispute(escrow.escrowId));
    }
  }

  function handleTxClose() {
    reset();
    refetch();
  }

  return (
    <PageShell>
      <TransactionModal
        state={txState}
        txHash={txHash}
        error={txError}
        onClose={handleTxClose}
        onRetry={txState === "error" ? executeAction : undefined}
      />

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmModal.action === "fund" && "Fund Escrow"}
              {confirmModal.action === "confirm" && "Confirm Delivery"}
              {confirmModal.action === "raise-dispute" && "Raise Dispute"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {confirmModal.action === "fund" &&
                "This will transfer funds from your wallet into the escrow contract."}
              {confirmModal.action === "confirm" &&
                "This will release the escrowed funds to the seller. This action cannot be undone."}
              {confirmModal.action === "raise-dispute" &&
                "This will flag the escrow as disputed and notify the arbitrator."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors ${
                  confirmModal.action === "raise-dispute"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-brand-500 hover:bg-brand-600"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Your Escrows</h1>
          {!loading && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold">
              {escrows.length}
            </span>
          )}
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Escrow
        </Link>
      </div>

      {/* Wallet notice */}
      {!connected && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Connect your Freighter wallet to see your real escrows. Showing mock
          data for preview.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(["buyer", "seller"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            As {t.charAt(0).toUpperCase() + t.slice(1)}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {t === "buyer" ? buyerEscrows.length : sellerEscrows.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <EscrowEmptyState tab={tab} />
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.map((escrow) => (
            <EscrowCard
              key={escrow.id}
              escrow={escrow}
              viewerAddress={effectiveAddress}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
