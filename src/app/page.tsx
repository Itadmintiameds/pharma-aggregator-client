import { Suspense } from "react";
import Home from "./components/landingPage/Home";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}





// "use client";
// import Home from "./components/landingPage/Home";


// const page = () => {
//   return (
//     <div>
//       < Home />
//     </div>
//   )
// }

// export default page