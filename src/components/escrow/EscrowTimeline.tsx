import type { EscrowEvent } from "@/types/escrow";

interface EscrowTimelineProps {
  events: EscrowEvent[];
}

const EVENT_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  escrow_created: {
    label: "Escrow created",
    color: "text-gray-600",
    bgColor: "bg-gray-200",
  },
  escrow_funded: {
    label: "Escrow funded",
    color: "text-blue-600",
    bgColor: "bg-blue-200",
  },
  delivery_confirmed: {
    label: "Delivery confirmed",
    color: "text-green-600",
    bgColor: "bg-green-200",
  },
  dispute_raised: {
    label: "Dispute raised",
    color: "text-orange-600",
    bgColor: "bg-orange-200",
  },
  dispute_resolved: {
    label: "Dispute resolved",
    color: "text-purple-600",
    bgColor: "bg-purple-200",
  },
  escrow_refunded: {
    label: "Escrow refunded",
    color: "text-yellow-600",
    bgColor: "bg-yellow-200",
  },
  escrow_expired: {
    label: "Escrow expired",
    color: "text-red-600",
    bgColor: "bg-red-200",
  },
};

const STELLAR_EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EscrowTimeline({ events }: EscrowTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No events recorded yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {events.map((event, idx) => {
        const config = EVENT_CONFIG[event.eventType] ?? {
          label: event.eventType,
          color: "text-gray-600",
          bgColor: "bg-gray-200",
        };
        const isLast = idx === events.length - 1;

        return (
          <li key={event.id} className="ml-6">
            {/* Dot */}
            <span
              className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor} ring-4 ring-white`}
            >
              <span className={`w-2 h-2 rounded-full ${config.bgColor.replace("bg-", "bg-").replace("-200", "-500")}`} />
            </span>

            <div className={isLast ? "" : ""}>
              <p className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </p>
              <time className="text-xs text-gray-400">
                {formatDate(event.createdAt)}
              </time>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Ledger #{event.ledger}
                </span>
                <a
                  href={`${STELLAR_EXPLORER_BASE}/${event.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-500 hover:underline font-mono"
                >
                  {event.txHash.slice(0, 8)}…
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
