// This route has no page content of its own — BuyerLoginModalProvider
// (mounted in ../layout.tsx) auto-opens the login popup for this exact
// pathname, so a direct/hard navigation here still shows the popup instead
// of a bare screen. In-app navigation opens the same popup via
// useBuyerLoginModal() without ever visiting this route.
export default function BuyerLoginPage() {
  return null;
}
