export enum EscrowState {
  INIT = "INIT",
  FUNDED = "FUNDED",
  COMPLETED = "COMPLETED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
}

export interface EscrowEvent {
  id: string;
  escrowId: string;
  eventType: string;
  ledger: number;
  txHash: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Escrow {
  id: string;
  escrowId: string;
  buyer: string;
  seller: string;
  arbitrator: string | null;
  /** Amount in stroops (i128 as string) */
  amount: string;
  tokenAddress: string;
  /** Token symbol derived from tokenAddress for display */
  tokenSymbol?: string;
  state: EscrowState;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  events: EscrowEvent[];
}

export interface CreateEscrowInput {
  seller: string;
  arbitrator?: string;
  amount: string;
  tokenAddress: string;
  deadline: string;
}

export interface ResolveInput {
  escrowId: string;
  releaseToSeller: boolean;
  reason?: string;
}

export type WalletRole = "buyer" | "seller" | "arbitrator" | "observer";

export function getRole(escrow: Escrow, address: string | null): WalletRole {
  if (!address) return "observer";
  if (escrow.buyer === address) return "buyer";
  if (escrow.seller === address) return "seller";
  if (escrow.arbitrator === address) return "arbitrator";
  return "observer";
}
