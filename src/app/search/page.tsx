import { Suspense } from "react";
import SearchResultsView from "./SearchResultsView";

export const metadata = {
  title: "Search products | Tiameds-MarketPlace",
};

// useSearchParams (used by the view) needs a Suspense boundary so the page can still be prerendered.
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <SearchResultsView />
    </Suspense>
  );
}
