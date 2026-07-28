import { Suspense } from "react";
import Home from "./components/landingPage/Home";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}