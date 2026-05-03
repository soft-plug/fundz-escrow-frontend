/**
 * API service layer.
 *
 * Phase 2: All functions call the real backend at NEXT_PUBLIC_API_URL.
 * The function signatures are identical to Phase 1 — no other file changed.
 */

import type { CreateEscrowInput, Escrow, ResolveInput } from "@/types/escrow";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Typed fetch wrapper ───────────────────────────────────────────────────────

interface FetchOptions {
  method?: "GET" | "POST";
  body?: unknown;
  walletAddress?: string;
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, walletAddress } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (walletAddress) {
    headers["x-wallet-address"] = walletAddress;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (err as { error?: string }).error ?? `HTTP ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ── Wallet address helper ─────────────────────────────────────────────────────
// Reads from Zustand store at call-time (avoids circular imports)

function getWalletAddress(): string | undefined {
  try {
    // Dynamic import-safe: read from localStorage key set by Zustand persist
    // Falls back to undefined if not available (SSR / not connected)
    if (typeof window === "undefined") return undefined;
    const raw = localStorage.getItem("wallet-store");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { address?: string } };
    return parsed?.state?.address ?? undefined;
  } catch {
    return undefined;
  }
}

// ── Transaction-building endpoints ────────────────────────────────────────────

export async function createEscrow(
  input: CreateEscrowInput
): Promise<{ xdr: string }> {
  return apiFetch<{ xdr: string }>("/escrow/create", {
    method: "POST",
    body: input,
    walletAddress: getWalletAddress(),
  });
}

export async function fundEscrow(
  escrowId: string
): Promise<{ xdr: string }> {
  return apiFetch<{ xdr: string }>("/escrow/fund", {
    method: "POST",
    body: { escrowId },
    walletAddress: getWalletAddress(),
  });
}

export async function confirmDelivery(
  escrowId: string
): Promise<{ xdr: string }> {
  return apiFetch<{ xdr: string }>("/escrow/confirm-delivery", {
    method: "POST",
    body: { escrowId },
    walletAddress: getWalletAddress(),
  });
}

export async function raiseDispute(
  escrowId: string
): Promise<{ xdr: string }> {
  return apiFetch<{ xdr: string }>("/escrow/raise-dispute", {
    method: "POST",
    body: { escrowId },
    walletAddress: getWalletAddress(),
  });
}

export async function resolveDispute(
  input: ResolveInput
): Promise<{ xdr: string }> {
  return apiFetch<{ xdr: string }>("/escrow/resolve-dispute", {
    method: "POST",
    body: {
      escrowId: input.escrowId,
      releaseToSeller: input.releaseToSeller,
      reason: input.reason,
    },
    walletAddress: getWalletAddress(),
  });
}

export async function submitTransaction(
  signedXdr: string
): Promise<{ txHash: string }> {
  return apiFetch<{ txHash: string }>("/escrow/submit", {
    method: "POST",
    body: { signedXdr },
  });
}

// ── Read endpoints ────────────────────────────────────────────────────────────

export async function getEscrow(escrowId: string): Promise<Escrow> {
  return apiFetch<Escrow>(`/escrow/${encodeURIComponent(escrowId)}`);
}

export async function getEscrowsByBuyer(address: string): Promise<Escrow[]> {
  return apiFetch<Escrow[]>(
    `/escrow/buyer/${encodeURIComponent(address)}`
  );
}

export async function getEscrowsBySeller(address: string): Promise<Escrow[]> {
  return apiFetch<Escrow[]>(
    `/escrow/seller/${encodeURIComponent(address)}`
  );
}

export async function getEscrowsByArbitrator(
  address: string
): Promise<Escrow[]> {
  // Backend doesn't have a dedicated arbitrator endpoint yet —
  // fetch buyer + seller and filter client-side for now
  const [asBuyer, asSeller] = await Promise.all([
    getEscrowsByBuyer(address),
    getEscrowsBySeller(address),
  ]);
  const seen = new Set<string>();
  return [...asBuyer, ...asSeller].filter((e) => {
    if (seen.has(e.escrowId)) return false;
    seen.add(e.escrowId);
    return e.arbitrator === address;
  });
}
