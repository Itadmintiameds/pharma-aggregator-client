import { Suspense } from "react";
import Home from "@/src/app/components/landingPage/Home";

// BuyerLoginModalProvider (mounted in the root layout) auto-opens the buyer login
// popup for this exact pathname, so a direct/hard navigation here (e.g. the
// "Login" button in the buyer approval email) still shows the popup.
//
// The popup is an overlay, so this route renders the landing page behind it —
// otherwise the overlay's blur sits over an empty white page and just looks like a
// flat grey screen. Closing the popup already routes to "/" (see
// BuyerLoginModalContext.closeLoginModal), which shows this same page.
// Home reads useSearchParams(), so it needs the Suspense boundary, same as app/page.tsx.
export default function BuyerLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}
