const IFSC_API = "https://ifsc.razorpay.com";

export interface IFSCDetails {
  BANK: string;
  BRANCH: string;
  STATE: string;
  DISTRICT: string;
  CITY?: string;
  [key: string]: string | undefined;
}


export async function fetchBankDetails(ifsc: string): Promise<IFSCDetails> {
  const response = await fetch(`${IFSC_API}/${ifsc}`);
  if (!response.ok) {
    throw new Error("Invalid IFSC Code");
  }
  return response.json();
}