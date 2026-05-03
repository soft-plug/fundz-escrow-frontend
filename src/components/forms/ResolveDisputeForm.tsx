"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransaction } from "@/hooks/useTransaction";
import { resolveDispute } from "@/services/api";
import { TransactionModal } from "@/components/shared/TransactionModal";

const schema = z.object({
  decision: z.enum(["release", "refund"], {
    required_error: "Please select a resolution",
  }),
  reason: z.string().max(500, "Max 500 characters").optional(),
});

type FormData = z.infer<typeof schema>;

interface ResolveDisputeFormProps {
  escrowId: string;
  onSuccess?: () => void;
}

export function ResolveDisputeForm({
  escrowId,
  onSuccess,
}: ResolveDisputeFormProps) {
  const { state: txState, txHash, error: txError, execute, reset } = useTransaction();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const decision = watch("decision");

  async function onSubmit(data: FormData) {
    await execute(() =>
      resolveDispute({
        escrowId,
        releaseToSeller: data.decision === "release",
        reason: data.reason,
      })
    );
  }

  function handleClose() {
    if (txState === "success") {
      onSuccess?.();
    } else {
      reset();
    }
  }

  return (
    <>
      <TransactionModal
        state={txState}
        txHash={txHash}
        error={txError}
        onClose={handleClose}
        onRetry={txState === "error" ? handleSubmit(onSubmit) : undefined}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Resolution decision <span className="text-red-500">*</span>
          </p>
          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                decision === "release"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                value="release"
                {...register("decision")}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Release funds to seller
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  The seller fulfilled their obligations. Transfer the escrowed
                  amount to the seller.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                decision === "refund"
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                value="refund"
                {...register("decision")}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Refund buyer
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  The seller did not fulfill their obligations. Return the
                  escrowed amount to the buyer.
                </p>
              </div>
            </label>
          </div>
          {errors.decision && (
            <p className="text-xs text-red-500 mt-1">
              {errors.decision.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason{" "}
            <span className="text-gray-400 font-normal">(optional, stored off-chain)</span>
          </label>
          <textarea
            {...register("reason")}
            rows={3}
            placeholder="Explain your decision…"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          {errors.reason && (
            <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!decision}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Resolve Dispute
        </button>
      </form>
    </>
  );
}
