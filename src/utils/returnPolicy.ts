// A product's return policy as the seller product forms hold it, and as product-service expects it.

export const DEFAULT_RETURN_PERIOD_DAYS = 7;

export interface ReturnPolicyForm {
  returnable: boolean;
  returnPeriodDays: string;
}

export const returnPolicyDefaults: ReturnPolicyForm = {
  returnable: true,
  returnPeriodDays: String(DEFAULT_RETURN_PERIOD_DAYS),
};

/** Form state for a loaded product; products saved before the policy existed are returnable for 7 days. */
export function returnPolicyFromProduct(data: {
  returnable?: boolean | null;
  returnPeriodDays?: number | null;
}): ReturnPolicyForm {
  if (data.returnable === false) {
    return { returnable: false, returnPeriodDays: "" };
  }
  return {
    returnable: true,
    returnPeriodDays: String(data.returnPeriodDays ?? DEFAULT_RETURN_PERIOD_DAYS),
  };
}

/** Error for the return period field, or undefined when the policy is valid. */
export function returnPeriodError(form: ReturnPolicyForm): string | undefined {
  if (!form.returnable) return undefined;
  const value = form.returnPeriodDays.trim();
  if (!value) return "Return period is required";
  if (!/^\d+$/.test(value) || Number(value) <= 0) return "Enter a whole number of days greater than 0";
  return undefined;
}

/**
 * Request fields for the policy. An invalid period sends nothing, so product-service keeps the current
 * policy — only drafts get that far, since publishing is blocked by returnPeriodError.
 */
export function returnPolicyPayload(form: ReturnPolicyForm): {
  returnable?: boolean;
  returnPeriodDays?: number | null;
} {
  if (!form.returnable) return { returnable: false, returnPeriodDays: null };
  if (returnPeriodError(form)) return {};
  return { returnable: true, returnPeriodDays: Number(form.returnPeriodDays.trim()) };
}

/** Buyer-facing label, e.g. "7-day return" or "Not returnable". */
export function returnPolicyLabel(returnable?: boolean | null, returnPeriodDays?: number | null): string {
  if (returnable === false) return "Not returnable";
  return `${returnPeriodDays ?? DEFAULT_RETURN_PERIOD_DAYS}-day return`;
}
