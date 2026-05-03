"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { EscrowStateBadge } from "@/components/escrow/EscrowStateBadge";
import { EscrowTimeline } from "@/components/escrow/EscrowTimeline";
import { ResolveDisputeForm } from "@/components/forms/ResolveDisputeForm";
import { AddressTag } from "@/components/shared/AddressTag";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { TransactionModal } from "@/components/shared/TransactionModal";
import { useEscrow } from "@/hooks/useEscrow";
import { useWallet } from "@/hooks/useWallet";
import { useTransaction } from "@/hooks/useTransaction";
import { fundEscrow, confirmDelivery, raiseDispute } from "@/services/api";
import { EscrowState, getRole } from "@/types/escrow";

const STELLAR_EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EscrowDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { address } = useWallet();
  const effectiveAddress = address;

  const { escrow, loading, error, refetch } = useEscrow(id);
  const { state: txState, txHash, error: txError, execute, reset } = useTransaction();
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false);

  const role = escrow ? getRole(escrow, effectiveAddress) : "observer";

  async function handleFund() {
    if (!escrow) return;
    await execute(() => fundEscrow(escrow.escrowId));
  }

  async function handleConfirm() {
    if (!escrow) return;
    await execute(() => confirmDelivery(escrow.escrowId));
  }

  async function handleRaiseDispute() {
    if (!escrow) return;
    setShowDisputeConfirm(false);
    await execute(() => raiseDispute(escrow.escrowId));
  }

  function handleTxClose() {
    reset();
    refetch();
  }

  if (loading) {
    return (
      <PageShell>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="h-80 bg-gray-100 rounded-2xl" />
            <div className="h-80 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !escrow) {
    return (
      <PageShell>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-600">
          {error ?? "Escrow not found."}
        </div>
      </PageShell>
    );
  }

  const lastTxHash = escrow.events[escrow.events.length - 1]?.txHash;

  return (
    <PageShell>
      <TransactionModal
        state={txState}
        txHash={txHash}
        error={txError}
        onClose={handleTxClose}
        onRetry={txState === "error" ? handleFund : undefined}
      />

      {/* Dispute confirmation modal */}
      {showDisputeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Raise a dispute?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This will flag the escrow as disputed and notify the arbitrator.
              The arbitrator will review and decide how to resolve it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Raise Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-mono">
          {escrow.escrowId}
        </h1>
        <EscrowStateBadge state={escrow.state} size="lg" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Details */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Escrow Details
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Escrow ID">
                <span className="font-mono text-xs text-gray-700">
                  {escrow.escrowId}
                </span>
              </DetailRow>
              <DetailRow label="Buyer">
                <AddressTag address={escrow.buyer} />
                {escrow.buyer === effectiveAddress && (
                  <span className="ml-1 text-xs text-brand-500 font-medium">
                    (you)
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Seller">
                <AddressTag address={escrow.seller} />
                {escrow.seller === effectiveAddress && (
                  <span className="ml-1 text-xs text-brand-500 font-medium">
                    (you)
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Arbitrator">
                {escrow.arbitrator ? (
                  <>
                    <AddressTag address={escrow.arbitrator} />
                    {escrow.arbitrator === effectiveAddress && (
                      <span className="ml-1 text-xs text-brand-500 font-medium">
                        (you)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 italic">
                    None — trustless mode
                  </span>
                )}
              </DetailRow>
              <hr className="border-gray-100" />
              <DetailRow label="Amount">
                <AmountDisplay
                  amount={escrow.amount}
                  tokenAddress={escrow.tokenAddress}
                  tokenSymbol={escrow.tokenSymbol}
                />
              </DetailRow>
              <DetailRow label="Token">
                <span className="font-mono text-xs text-gray-700">
                  {escrow.tokenAddress}
                </span>
              </DetailRow>
              <hr className="border-gray-100" />
              <DetailRow label="Created">
                {new Date(escrow.createdAt).toLocaleString()}
              </DetailRow>
              <DetailRow label="Deadline">
                {new Date(escrow.deadline).toLocaleString()}
              </DetailRow>
              <DetailRow label="State">
                <EscrowStateBadge state={escrow.state} size="sm" />
              </DetailRow>
            </dl>
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              History
            </h2>
            <EscrowTimeline events={escrow.events} />
          </section>
        </div>

        {/* Right — Actions */}
        <div className="space-y-4">
          {/* Role-aware action panel */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Actions
            </h2>

            {/* INIT + buyer */}
            {escrow.state === EscrowState.INIT && role === "buyer" && (
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
                  <p className="font-medium mb-1">Awaiting your funding</p>
                  <p className="text-xs">
                    Transfer{" "}
                    <AmountDisplay
                      amount={escrow.amount}
                      tokenAddress={escrow.tokenAddress}
                      tokenSymbol={escrow.tokenSymbol}
                    />{" "}
                    into the escrow contract to activate it.
                  </p>
                </div>
                <button
                  onClick={handleFund}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                >
                  Fund Escrow
                </button>
              </div>
            )}

            {/* INIT + not buyer */}
            {escrow.state === EscrowState.INIT && role !== "buyer" && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
                Waiting for the buyer to fund this escrow.
              </div>
            )}

            {/* FUNDED + buyer */}
            {escrow.state === EscrowState.FUNDED && role === "buyer" && (
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-medium mb-1">Funds are held in escrow</p>
                  <p className="text-xs">
                    Confirm delivery once you&apos;ve received what was agreed.
                    Or raise a dispute if there&apos;s a problem.
                  </p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                >
                  Confirm Delivery
                </button>
                {escrow.arbitrator && (
                  <button
                    onClick={() => setShowDisputeConfirm(true)}
                    className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    Raise Dispute
                  </button>
                )}
              </div>
            )}

            {/* FUNDED + seller */}
            {escrow.state === EscrowState.FUNDED && role === "seller" && (
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-medium mb-1">Funds are held in escrow</p>
                  <p className="text-xs">
                    The buyer will release funds once they confirm delivery.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
                  Awaiting buyer confirmation
                </div>
              </div>
            )}

            {/* DISPUTED + arbitrator */}
            {escrow.state === EscrowState.DISPUTED && role === "arbitrator" && (
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700">
                  <p className="font-medium mb-1">Dispute requires resolution</p>
                  <p className="text-xs">
                    Review the situation and decide whether to release funds to
                    the seller or refund the buyer.
                  </p>
                </div>
                <ResolveDisputeForm
                  escrowId={escrow.escrowId}
                  onSuccess={refetch}
                />
              </div>
            )}

            {/* DISPUTED + not arbitrator */}
            {escrow.state === EscrowState.DISPUTED && role !== "arbitrator" && (
              <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700">
                <p className="font-medium mb-1">Dispute in progress</p>
                <p className="text-xs">
                  The arbitrator is reviewing this dispute. You&apos;ll be
                  notified when a decision is made.
                </p>
              </div>
            )}

            {/* COMPLETED */}
            {escrow.state === EscrowState.COMPLETED && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium">Transaction complete</p>
                  <p className="text-xs mt-1">
                    Funds have been released to the seller.
                  </p>
                </div>
                {lastTxHash && (
                  <a
                    href={`${STELLAR_EXPLORER_BASE}/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Stellar Explorer
                  </a>
                )}
              </div>
            )}

            {/* REFUNDED */}
            {escrow.state === EscrowState.REFUNDED && (
              <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700 text-center">
                <p className="font-medium">Escrow refunded</p>
                <p className="text-xs mt-1">
                  Funds have been returned to the buyer.
                </p>
              </div>
            )}

            {/* EXPIRED */}
            {escrow.state === EscrowState.EXPIRED && (
              <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600 text-center">
                <p className="font-medium">Escrow expired</p>
                <p className="text-xs mt-1">
                  The deadline passed and funds were returned to the buyer.
                </p>
              </div>
            )}
          </section>

          {/* Your role badge */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Your role</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-gray-400 flex-shrink-0 w-24">{label}</dt>
      <dd className="flex items-center gap-1 text-right">{children}</dd>
    </div>
  );
}
