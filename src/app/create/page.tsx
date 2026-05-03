import { PageShell } from "@/components/layout/PageShell";
import { CreateEscrowForm } from "@/components/forms/CreateEscrowForm";
import Link from "next/link";

export const metadata = {
  title: "Create Escrow — StellarEscrow",
};

export default function CreateEscrowPage() {
  return (
    <PageShell>
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

      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Create Escrow
          </h1>
          <p className="text-sm text-gray-500">
            Set up a trustless escrow on the Stellar network. Funds are held by
            a smart contract until delivery is confirmed.
          </p>
        </div>

        <CreateEscrowForm />
      </div>
    </PageShell>
  );
}
