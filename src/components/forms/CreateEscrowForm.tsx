"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTransaction } from "@/hooks/useTransaction";
import { useWallet } from "@/hooks/useWallet";
import { createEscrow } from "@/services/api";
import { TransactionModal } from "@/components/shared/TransactionModal";
import { AmountDisplay } from "@/components/shared/AmountDisplay";

// ── Zod schemas per step ────────────────────────────────────────────────────

const stellarAddress = z
  .string()
  .min(1, "Address is required")
  .regex(/^G[A-Z2-7]{55}$/, "Must be a valid Stellar address (G... 56 chars)");

const step1Schema = z.object({
  seller: stellarAddress,
  arbitrator: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^G[A-Z2-7]{55}$/.test(v),
      "Must be a valid Stellar address"
    ),
});

const TOKEN_OPTIONS = [
  { label: "USDC", value: "USDC" },
  { label: "XLM", value: "XLM" },
  { label: "Custom", value: "custom" },
];

const step2Schema = z.object({
  tokenAddress: z.string().min(1, "Token is required"),
  customToken: z.string().optional(),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n > 0;
    }, "Amount must be greater than 0")
    .refine((v) => {
      const parts = v.split(".");
      return !parts[1] || parts[1].length <= 12;
    }, "Max 12 decimal places"),
});

const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

const step3Schema = z.object({
  deadline: z
    .string()
    .min(1, "Deadline is required")
    .refine((v) => {
      const d = new Date(v);
      return d > minDeadline;
    }, "Deadline must be at least 24 hours from now"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface FormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

const STEPS = ["Parties", "Token & Amount", "Deadline", "Review"];

// ── Component ───────────────────────────────────────────────────────────────

export function CreateEscrowForm() {
  const router = useRouter();
  const { address } = useWallet();
  const { state: txState, txHash, error: txError, execute, reset } = useTransaction();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});

  // Step 1
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData.step1,
  });

  // Step 2
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData.step2 ?? { tokenAddress: "USDC" },
  });

  // Step 3
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData.step3,
  });

  const watchedToken = form2.watch("tokenAddress");

  function goToStep(n: number) {
    setStep(n);
  }

  async function onStep1(data: Step1Data) {
    setFormData((prev) => ({ ...prev, step1: data }));
    setStep(1);
  }

  async function onStep2(data: Step2Data) {
    setFormData((prev) => ({ ...prev, step2: data }));
    setStep(2);
  }

  async function onStep3(data: Step3Data) {
    setFormData((prev) => ({ ...prev, step3: data }));
    setStep(3);
  }

  function toStroops(amount: string, token: string): string {
    const decimals = token === "XLM" ? 7 : 6;
    const [whole, frac = ""] = amount.split(".");
    const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
    return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded)).toString();
  }

  async function handleSubmit() {
    const { step1, step2, step3 } = formData as FormData;
    const token =
      step2.tokenAddress === "custom"
        ? (step2.customToken ?? "")
        : step2.tokenAddress;

    await execute(() =>
      createEscrow({
        seller: step1.seller,
        arbitrator: step1.arbitrator || undefined,
        amount: toStroops(step2.amount, token),
        tokenAddress: token,
        deadline: new Date(step3.deadline).toISOString(),
      })
    );
  }

  function handleTxClose() {
    if (txState === "success") {
      router.push("/");
    } else {
      reset();
    }
  }

  const { step1, step2, step3 } = formData as Partial<FormData>;

  return (
    <>
      <TransactionModal
        state={txState}
        txHash={txHash}
        error={txError}
        onClose={handleTxClose}
        onRetry={txState === "error" ? handleSubmit : undefined}
      />

      {/* Progress indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && goToStep(i)}
              disabled={i >= step}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                i === step
                  ? "text-brand-600"
                  : i < step
                  ? "text-green-600 cursor-pointer"
                  : "text-gray-300 cursor-default"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i === step
                    ? "border-brand-500 bg-brand-500 text-white"
                    : i < step
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-200 text-gray-300"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  i < step ? "bg-green-400" : "bg-gray-100"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Parties */}
      {step === 0 && (
        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Parties</h2>
            <p className="text-sm text-gray-500">
              Define who is involved in this escrow.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your address (Buyer)
              </label>
              <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-mono text-sm text-gray-500">
                {address ?? "Connect wallet first"}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                You are the buyer — you will fund and release the escrow.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller address <span className="text-red-500">*</span>
              </label>
              <input
                {...form1.register("seller")}
                placeholder="GABC...XYZ"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {form1.formState.errors.seller && (
                <p className="text-xs text-red-500 mt-1">
                  {form1.formState.errors.seller.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                The party who will deliver goods or services.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arbitrator address{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                {...form1.register("arbitrator")}
                placeholder="GABC...XYZ"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {form1.formState.errors.arbitrator && (
                <p className="text-xs text-red-500 mt-1">
                  {form1.formState.errors.arbitrator.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                A trusted third party who can resolve disputes. Leave blank for
                trustless mode (disputes cannot be raised).
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            Continue →
          </button>
        </form>
      )}

      {/* Step 2 — Token + Amount */}
      {step === 1 && (
        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Token & Amount
            </h2>
            <p className="text-sm text-gray-500">
              Choose the token and amount to hold in escrow.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token
              </label>
              <div className="flex gap-2">
                {TOKEN_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${
                      watchedToken === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...form2.register("tokenAddress")}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {watchedToken === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom token contract address
                </label>
                <input
                  {...form2.register("customToken")}
                  placeholder="CABC...XYZ"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  {...form2.register("amount")}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                  {watchedToken === "custom" ? "TOKEN" : watchedToken}
                </span>
              </div>
              {form2.formState.errors.amount && (
                <p className="text-xs text-red-500 mt-1">
                  {form2.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Estimated fee:</span>{" "}
              ~0.00001 XLM{" "}
              <span className="text-xs text-gray-400">(mocked in Phase 1)</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              Continue →
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Deadline */}
      {step === 2 && (
        <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Deadline
            </h2>
            <p className="text-sm text-gray-500">
              Set when this escrow expires if not completed.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry date & time <span className="text-red-500">*</span>
              </label>
              <input
                {...form3.register("deadline")}
                type="datetime-local"
                min={new Date(Date.now() + 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {form3.formState.errors.deadline && (
                <p className="text-xs text-red-500 mt-1">
                  {form3.formState.errors.deadline.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Minimum 24 hours from now. After this date, the buyer can
                reclaim funds if delivery hasn&apos;t been confirmed.
              </p>
            </div>

            {form3.watch("deadline") && !form3.formState.errors.deadline && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                Escrow expires in{" "}
                <strong>
                  {Math.ceil(
                    (new Date(form3.watch("deadline")).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </strong>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
            >
              Continue →
            </button>
          </div>
        </form>
      )}

      {/* Step 4 — Review */}
      {step === 3 && step1 && step2 && step3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Review & Submit
            </h2>
            <p className="text-sm text-gray-500">
              Confirm the details before creating your escrow.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 text-sm">
            <ReviewRow
              label="Buyer (you)"
              value={address ?? "—"}
              mono
              onEdit={() => {}}
            />
            <ReviewRow
              label="Seller"
              value={step1.seller}
              mono
              onEdit={() => goToStep(0)}
            />
            <ReviewRow
              label="Arbitrator"
              value={step1.arbitrator || "None — trustless mode"}
              mono={!!step1.arbitrator}
              onEdit={() => goToStep(0)}
            />
            <hr className="border-gray-200" />
            <ReviewRow
              label="Token"
              value={
                step2.tokenAddress === "custom"
                  ? step2.customToken ?? "—"
                  : step2.tokenAddress
              }
              onEdit={() => goToStep(1)}
            />
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Amount</span>
              <div className="flex items-center gap-2">
                <AmountDisplay
                  amount={(() => {
                    const token =
                      step2.tokenAddress === "custom"
                        ? step2.customToken ?? "XLM"
                        : step2.tokenAddress;
                    const decimals = token === "XLM" ? 7 : 6;
                    const [whole, frac = ""] = step2.amount.split(".");
                    const fracPadded = frac
                      .padEnd(decimals, "0")
                      .slice(0, decimals);
                    return (
                      BigInt(whole) * BigInt(10 ** decimals) +
                      BigInt(fracPadded)
                    ).toString();
                  })()}
                  tokenAddress={
                    step2.tokenAddress === "custom"
                      ? step2.customToken
                      : step2.tokenAddress
                  }
                />
                <button
                  onClick={() => goToStep(1)}
                  className="text-xs text-brand-500 hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
            <hr className="border-gray-200" />
            <ReviewRow
              label="Deadline"
              value={new Date(step3.deadline).toLocaleString()}
              onEdit={() => goToStep(2)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!address}
              className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {address ? "Create Escrow" : "Connect wallet first"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewRow({
  label,
  value,
  mono = false,
  onEdit,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`truncate text-gray-800 ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </span>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-brand-500 hover:underline flex-shrink-0"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
