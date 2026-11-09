import type { Metadata } from "next";

// Internal page: keep it out of search engines and out of the site navigation.
export const metadata: Metadata = {
  title: "Search analytics | Tiameds-MarketPlace",
  robots: { index: false, follow: false },
};

export default function SearchAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
