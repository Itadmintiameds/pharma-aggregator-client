import buyerApi from "@/src/lib/buyerApi";

interface ApiResponseWrapper<T> {
  status: string;
  message: string;
  count: number | null;
  data: T;
}

export interface BuyerProfile {
  buyerId: string;
  organizationName?: string;
  status?: string;
  gstNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactMobile?: string;
}

const BUYER_ID_CACHE_KEY = "buyerId";
// The cached id is stored with the buyerUserId it was resolved for, so a different login (or a DB reset) never
// reuses another account's buyerId.
const BUYER_ID_CACHE_USER_KEY = "buyerIdUser";

// Resolves the approved Buyer business ID (needed for order placement/history)
// from the logged-in BuyerUser's own ID — see backend BuyerProfileController.
// Cached in localStorage after the first fetch since it never changes for a
// given account; cleared on logout by buyerAuthService.clearAuth() callers
// clearing localStorage wholesale (this key rides along with that).
export async function getBuyerId(buyerUserId: number): Promise<string> {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(BUYER_ID_CACHE_KEY);
    if (cached && localStorage.getItem(BUYER_ID_CACHE_USER_KEY) === String(buyerUserId)) return cached;
  }

  const buyerId = (await getBuyerProfile(buyerUserId)).buyerId;

  if (typeof window !== "undefined" && buyerId) {
    localStorage.setItem(BUYER_ID_CACHE_KEY, buyerId);
    localStorage.setItem(BUYER_ID_CACHE_USER_KEY, String(buyerUserId));
  }

  return buyerId;
}

/** The approved buyer record in full, as buyer-service returns it (GET /buyers/user/{userId}). */
export interface ApprovedBuyerProfile {
  buyerId: string;
  buyerName?: string;
  gstNumber?: string;
  panNumber?: string;
  buyerTypeName?: string;
  status?: string;
  email?: string;
  phone?: string;
  address?: {
    buildingNo?: string;
    street?: string;
    landmark?: string;
    city?: string;
    pinCode?: string;
    talukaName?: string;
    districtName?: string;
    stateName?: string;
  };
  contacts?: Array<{
    contactId?: number;
    name?: string;
    designation?: string;
    email?: string;
    isEmailVerified?: boolean;
    emailVerified?: boolean;
    mobile?: string;
    isPhoneVerified?: boolean;
    phoneVerified?: boolean;
  }>;
  documents?: Array<{
    documentId?: number;
    documentTypeName?: string;
    documentNumber?: string;
    documentFileUrl?: string;
    licenseIssueDate?: string;
    licenseExpiryDate?: string;
    licenseIssuingAuthority?: string;
  }>;
}

// The profile page shows this record - it is what the platform actually uses (orders, quotes, admin updates) - and
// only falls back to the original registration form while the buyer is not approved yet.
// Resolves to null when there is no approved record (404).
export async function getApprovedBuyerProfile(buyerUserId: number): Promise<ApprovedBuyerProfile | null> {
  try {
    const response = await buyerApi.get<ApiResponseWrapper<ApprovedBuyerProfile>>(`/buyers/user/${buyerUserId}`, {
      skipAuthRedirect: true,
    });
    return response.data.data ?? null;
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return null;
    throw error;
  }
}

// Shape returned by buyer-service's BuyerProfileController (GET /buyers/user/{userId}).
interface BuyerProfileApiResponse {
  buyerId: string;
  buyerName?: string;
  status?: string;
  gstNumber?: string;
  email?: string;
  phone?: string;
  contacts?: Array<{ name?: string; email?: string; mobile?: string }>;
}

// Full profile (contact name/email/mobile, GST) for prefilling forms like
// Get Quote / Request Price. Not cached — always reflects the latest
// approved Buyer record.
export async function getBuyerProfile(buyerUserId: number): Promise<BuyerProfile> {
  // Routed by the gateway as /api/v1/buyers/** -> buyer-service /buyers/user/{userId}.
  // 404 means the buyer has not been approved yet (no Buyer record), which callers handle.
  const response = await buyerApi.get<ApiResponseWrapper<BuyerProfileApiResponse>>(
    `/buyers/user/${buyerUserId}`
  );
  const profile = response.data.data;
  const contact = profile.contacts?.[0];
  return {
    buyerId: profile.buyerId,
    organizationName: profile.buyerName,
    status: profile.status,
    gstNumber: profile.gstNumber,
    contactName: contact?.name,
    contactEmail: contact?.email ?? profile.email,
    contactMobile: contact?.mobile ?? profile.phone,
  };
}
