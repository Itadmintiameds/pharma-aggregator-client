/** One promotional card in the landing page ad strip (public fields are always present). */
export interface AdBanner {
  id: number;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  buttonText?: string | null;
  imageUrl: string;
  /** Resolved click destination: the linked product's page, else the custom link. */
  targetUrl: string;
  openInNewTab?: boolean | null;
  displayOrder?: number | null;
  // Admin-only fields (absent from the public feed).
  linkUrl?: string | null;
  productId?: string | null;
  active?: boolean | null;
  startAt?: string | null;
  endAt?: string | null;
  clickCount?: number | null;
}

/** Create/update payload sent from the admin dashboard. */
export interface AdBannerInput {
  title: string;
  subtitle: string;
  badgeText: string;
  buttonText: string;
  imageUrl: string;
  linkUrl: string;
  productId: string;
  openInNewTab: boolean;
  displayOrder: number;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
}
