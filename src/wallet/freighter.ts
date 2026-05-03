/**
 * Freighter wallet integration.
 * All functions are safe to call server-side (they check for window).
 */

// Dynamic import to avoid SSR issues with the Freighter browser extension API
async function getFreighter() {
  if (typeof window === "undefined") return null;
  try {
    const mod = await import("@stellar/freighter-api");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

export async function isInstalled(): Promise<boolean> {
  const freighter = await getFreighter();
  if (!freighter) return false;
  try {
    return await freighter.isConnected();
  } catch {
    return false;
  }
}

export async function connect(): Promise<string | null> {
  const freighter = await getFreighter();
  if (!freighter) return null;
  try {
    await freighter.requestAccess();
    return await freighter.getPublicKey();
  } catch {
    return null;
  }
}

export async function getAddress(): Promise<string | null> {
  const freighter = await getFreighter();
  if (!freighter) return null;
  try {
    return await freighter.getPublicKey();
  } catch {
    return null;
  }
}

export async function getNetwork(): Promise<string> {
  const freighter = await getFreighter();
  if (!freighter) return "unknown";
  try {
    return await freighter.getNetwork();
  } catch {
    return "unknown";
  }
}

export async function sign(
  xdr: string,
  network: string
): Promise<string | null> {
  const freighter = await getFreighter();
  if (!freighter) return null;
  try {
    return await freighter.signTransaction(xdr, { network });
  } catch {
    return null;
  }
}
