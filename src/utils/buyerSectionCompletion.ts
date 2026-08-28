import { RawTempBuyer } from "@/src/services/buyer/buyerRegistrationService";

// One entry per row in the onboarding hub card (BuyerProfileHubCard). Bank
// / Billing has no backing data anywhere (no entity fields, DTOs, or
// endpoints exist for it yet — see CLAUDE.md's cross-repo note) and its row
// has been dropped from the hub entirely, so it isn't tracked here either.
export interface BuyerSectionCompletion {
  org: boolean;
  contact: boolean;
  license: boolean;
  gst: boolean;
}

export const BUYER_SECTION_COUNT = 4;

// No section-level completion flags exist server-side on TempBuyer — this
// derives Completed/Pending purely from which fields are already populated.
export function getSectionCompletion(tempBuyer: RawTempBuyer | null): BuyerSectionCompletion {
  const org = !!tempBuyer?.organizationName && !!tempBuyer?.address?.city && !!tempBuyer?.address?.pinCode;
  const contact = !!tempBuyer?.contact?.name && !!tempBuyer?.contact?.email && !!tempBuyer?.contact?.mobile;
  const license = !!tempBuyer?.documents?.some((doc) => !!doc.documentNumber && !!doc.documentFileUrl);
  const gst = !!tempBuyer?.gstNumber || !!tempBuyer?.panNumber;

  return { org, contact, license, gst };
}

export function getCompletedSectionCount(completion: BuyerSectionCompletion): number {
  return Object.values(completion).filter(Boolean).length;
}
