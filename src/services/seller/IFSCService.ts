
const RAZORPAY_API = "https://ifsc.razorpay.com";
const FALLBACK_API = "https://api.bankify.in/ifsc";
const BACKEND_API = `${process.env.NEXT_PUBLIC_API_URL}ifsc`;

export interface IFSCDetails {
  BANK: string;
  BRANCH: string;
  STATE: string;
  DISTRICT: string;
  CITY?: string;
  [key: string]: string | undefined;
}

const SKIP_RAZORPAY = ["KSCB"];

function shouldSkipRazorpay(ifsc: string) {
  return SKIP_RAZORPAY.some((p) => ifsc.startsWith(p));
}

function isValidData(data: unknown): data is IFSCDetails {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.BANK === "string" && d.BANK.trim() !== "" &&
    typeof d.STATE === "string" && d.STATE.trim() !== "" &&
    typeof d.BRANCH === "string" && d.BRANCH.trim() !== ""
  );
}

async function safeFetch(url: string): Promise<IFSCDetails | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const payload = json?.data ?? json;
    return isValidData(payload) ? payload : null;
  } catch {
    return null;
  }
}

// ─── Fetch from your backend endpoint for KSCB IFSC codes ────────────────────
async function fetchFromBackend(ifsc: string): Promise<IFSCDetails | null> {
  try {
    const response = await fetch(`${BACKEND_API}/${ifsc}`);
    if (!response.ok) return null;
    const data = await response.json();
    // Handle both { BANK, BRANCH, ... } or { data: { BANK, BRANCH, ... } }
    const payload = data?.data ?? data;
    return isValidData(payload) ? payload : null;
  } catch (error) {
    console.error(`Backend fetch failed for ${ifsc}:`, error);
    return null;
  }
}

// ─── Fetch from Razorpay API ────────────────────────────────────────────────
async function fetchFromRazorpay(ifsc: string): Promise<IFSCDetails | null> {
  return safeFetch(`${RAZORPAY_API}/${ifsc}`);
}

// ─── Fetch from Fallback API ─────────────────────────────────────────────────
async function fetchFromFallback(ifsc: string): Promise<IFSCDetails | null> {
  return safeFetch(`${FALLBACK_API}/${ifsc}`);
}

export async function fetchBankDetails(ifsc: string): Promise<IFSCDetails> {
  const code = ifsc.trim().toUpperCase();

  // 1. Check if IFSC code starts with KSCB - use backend API first
  if (shouldSkipRazorpay(code)) {
    console.log(`Using backend API for KSCB IFSC code: ${code}`);
    
    // Try backend API for KSCB
    const backendData = await fetchFromBackend(code);
    if (backendData) {
      console.log(`Data fetched from backend for IFSC: ${code}`);
      return backendData;
    }
    
    // If backend fails, try fallback API
    const fallbackData = await fetchFromFallback(code);
    if (fallbackData) {
      console.log(`Data fetched from fallback API for IFSC: ${code}`);
      return fallbackData;
    }
    
    throw new Error("Invalid IFSC Code - KSCB bank details not found");
  }

  // 2. For non-KSCB codes, try Razorpay first
  const razorpayData = await fetchFromRazorpay(code);
  if (razorpayData) {
    console.log(`Data fetched from Razorpay for IFSC: ${code}`);
    return razorpayData;
  }

  // 3. Try fallback API if Razorpay fails
  const fallbackData = await fetchFromFallback(code);
  if (fallbackData) {
    console.log(`Data fetched from fallback API for IFSC: ${code}`);
    return fallbackData;
  }

  // 4. Try backend API as last resort for any IFSC
  const backendData = await fetchFromBackend(code);
  if (backendData) {
    console.log(`Data fetched from backend for IFSC: ${code}`);
    return backendData;
  }

  throw new Error("Invalid IFSC Code");
}









// old razor pay service code ....................

// const IFSC_API = "https://ifsc.razorpay.com";

// export interface IFSCDetails {
//   BANK: string;
//   BRANCH: string;
//   STATE: string;
//   DISTRICT: string;
//   CITY?: string;
//   [key: string]: string | undefined;
// }


// export async function fetchBankDetails(ifsc: string): Promise<IFSCDetails> {
//   const response = await fetch(`${IFSC_API}/${ifsc}`);
//   if (!response.ok) {
//     throw new Error("Invalid IFSC Code");
//   }
//   return response.json();
// }