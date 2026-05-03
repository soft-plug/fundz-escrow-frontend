import { EscrowState } from "@/types/escrow";

interface EscrowStateBadgeProps {
  state: EscrowState;
  size?: "sm" | "md" | "lg";
}

const STATE_CONFIG: Record<
  EscrowState,
  { label: string; className: string }
> = {
  [EscrowState.INIT]: {
    label: "Awaiting funds",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  [EscrowState.FUNDED]: {
    label: "Funded",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [EscrowState.COMPLETED]: {
    label: "Completed",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  [EscrowState.DISPUTED]: {
    label: "In dispute",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  [EscrowState.REFUNDED]: {
    label: "Refunded",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  [EscrowState.EXPIRED]: {
    label: "Expired",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5 font-semibold",
};

export function EscrowStateBadge({
  state,
  size = "md",
}: EscrowStateBadgeProps) {
  const config = STATE_CONFIG[state];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${SIZE_CLASSES[size]}`}
    >
      {config.label}
    </span>
  );
}
