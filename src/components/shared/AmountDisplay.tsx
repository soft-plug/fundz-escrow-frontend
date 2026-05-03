interface AmountDisplayProps {
  /** Raw amount in stroops (as string to handle i128) */
  amount: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  className?: string;
}

function formatAmount(amount: string, tokenAddress?: string): string {
  const raw = BigInt(amount);
  const isXlm =
    !tokenAddress ||
    tokenAddress === "XLM" ||
    tokenAddress === "native";
  const decimals = isXlm ? 7 : 6;
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

function resolveSymbol(tokenAddress?: string, tokenSymbol?: string): string {
  if (tokenSymbol) return tokenSymbol;
  if (!tokenAddress) return "XLM";
  if (tokenAddress === "XLM" || tokenAddress === "native") return "XLM";
  if (tokenAddress === "USDC") return "USDC";
  return tokenAddress.slice(0, 6) + "…";
}

export function AmountDisplay({
  amount,
  tokenSymbol,
  tokenAddress,
  className = "",
}: AmountDisplayProps) {
  const symbol = resolveSymbol(tokenAddress, tokenSymbol);
  const formatted = formatAmount(amount, tokenAddress);

  return (
    <span className={`font-semibold tabular-nums ${className}`}>
      {formatted}{" "}
      <span className="text-gray-500 font-normal text-sm">{symbol}</span>
    </span>
  );
}
