"use client";

import Link from "next/link";
import { EscrowStateBadge } from "./EscrowStateBadge";
import { AddressTag } from "@/components/shared/AddressTag";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { EscrowState, getRole, type Escrow } from "@/types/escrow";

interface EscrowCardProps {
  escrow: Escrow;
  viewerAddress: string | null;
  onAction?: (escrow: Escrow, action: string) => void;
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  return `Expires in ${diffDays}d`;
}

interface CtaConfig {
  label: string;
  className: string;
  action: string;
}

function getCta(escrow: Escrow, viewerAddress: string | null): CtaConfig | null {
  const role = getRole(escrow, viewerAddress);

  switch (escrow.state) {
    case EscrowState.INIT:
      if (role === "buyer")
        return {
          label: "Fund Escrow",
          className:
            "bg-amber-500 hover:bg-amber-600 text-white",
          action: "fund",
        };
      return null;

    case EscrowState.FUNDED:
      if (role === "buyer")
        return {
          label: "Confirm Delivery",
          className: "bg-green-600 hover:bg-green-700 text-white",
          action: "confirm",
        };
      if (role === "seller")
        return {
          label: "Request Release",
          className:
            "bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-default",
          action: "request-release",
        };
      return null;

    case EscrowState.DISPUTED:
      if (role === "arbitrator")
        return {
          label: "Resolve",
          className: "bg-purple-600 hover:bg-purple-700 text-white",
          action: "resolve",
        };
      return null;

    case EscrowState.COMPLETED:
      return {
        label: "View Receipt",
        className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
        action: "view",
      };

    case EscrowState.REFUNDED:
    case EscrowState.EXPIRED:
      return {
        label: "View Details",
        className: "bg-gray-100 hover:bg-gray-200 text-gray-700",
        action: "view",
      };

    default:
      return null;
  }
}

export function EscrowCard({ escrow, viewerAddress, onAction }: EscrowCardProps) {
  const role = getRole(escrow, viewerAddress);
  const counterparty =
    role === "buyer" ? escrow.seller : role === "seller" ? escrow.buyer : escrow.buyer;
  const counterpartyLabel =
    role === "buyer" ? "Seller" : role === "seller" ? "Buyer" : "Buyer";

  const cta = getCta(escrow, viewerAddress);

  function handleCta(e: React.MouseEvent) {
    if (!cta) return;
    if (cta.action === "view") return; // let Link handle it
    e.preventDefault();
    onAction?.(escrow, cta.action);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-mono mb-0.5">
            {escrow.escrowId}
          </p>
          <EscrowStateBadge state={escrow.state} size="sm" />
        </div>
        <AmountDisplay
          amount={escrow.amount}
          tokenAddress={escrow.tokenAddress}
          tokenSymbol={escrow.tokenSymbol}
          className="text-base"
        />
      </div>

      {/* Counterparty */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-xs font-medium text-gray-400 w-12 flex-shrink-0">
          {counterpartyLabel}
        </span>
        <AddressTag address={counterparty} />
      </div>

      {/* Deadline */}
      <p className="text-xs text-gray-400">{formatDeadline(escrow.deadline)}</p>

      {/* CTA */}
      {cta && (
        <Link
          href={`/escrow/${escrow.escrowId}`}
          onClick={handleCta}
          className={`w-full text-center py-2 rounded-xl text-sm font-medium transition-colors ${cta.className}`}
        >
          {cta.label}
        </Link>
      )}
      {!cta && (
        <Link
          href={`/escrow/${escrow.escrowId}`}
          className="w-full text-center py-2 rounded-xl text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
        >
          View Details
        </Link>
      )}
    </div>
  );
}
