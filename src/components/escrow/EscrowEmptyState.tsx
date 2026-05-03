import Link from "next/link";

interface EscrowEmptyStateProps {
  tab: "buyer" | "seller";
}

export function EscrowEmptyState({ tab }: EscrowEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Illustration */}
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {tab === "buyer" ? "No escrows as buyer" : "No escrows as seller"}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">
        {tab === "buyer"
          ? "Create your first escrow to securely hold funds until delivery is confirmed."
          : "You haven't been added as a seller in any escrow yet."}
      </p>

      {tab === "buyer" && (
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Escrow
        </Link>
      )}
    </div>
  );
}
