import React from "react";
import ImageSlider from "../ImageSlider";
import LandingHeader from "./LandingHeader";

const Home = () => {
  return (
    <div className="bg-primary-100 pt-18">
      <LandingHeader />

      <section className="mx-auto mt-10 w-4/5 space-y-12">
        {/* Heading + paragraph stacked */}
        <div className="space-y-1 bg-primary-1000">
          <h1 className="text-base-black">
            CONNECT VERIFIED PHARMA{" "}
            <span className="text-primary-500">BUYERS </span>
            &{" "}
            <span className="text--secondary-500">SELLERS</span>
          </h1>

          <p className="max-w-2xl text-neutral-700">
            Streamline operations, boost visibility, and ensure timely,
            safe medication delivery with our pharma supply chain platform
          </p>
        </div>

        {/* Full-width image slider */}
        <ImageSlider />
        <br />
        <br />
      </section>
      <div className="bg-red-500 text-white p-4">
  Tailwind Test
</div>

<div className="flex gap-4">
  <div className="h-16 w-16 bg-red-500">test</div>
  <div className="h-16 w-16 bg-primary-100">test</div>
  <div className="h-16 w-16 bg-[var(--primary-100)]">test</div>
</div>
    </div>
  );
};

export default Home;








// original code , do not make chanegs here /...............



// import React from "react";
// import ImageSlider from "../ImageSlider";
// import LandingHeader from "./LandingHeader"; 

// const Home = () => {
//   return (
//     <div className="bg-[#F3ECF8] pt-18">
//       <LandingHeader />

//       <section className="mx-auto mt-10 w-4/5 space-y-12">

//         {/* Heading + paragraph stacked */}
//         <div className="space-y-1">
//           <h1 className="text-4xl font-bold leading-tight text-[#0A0A0B]">
//             CONNECT VERIFIED 
//             PHARMA <span className="text-[#9A6AFF]">BUYERS </span>
//             & <span className="text-[#F5B942]">SELLERS</span>
//           </h1>

//           <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
//             Streamline operations, boost visibility, and ensure timely, safe
//             medication delivery with our pharma supply chain platform
//           </p>
//         </div>

//         {/* Full-width image slider */}
//         <ImageSlider />
//         <br /><br />

//       </section>
//     </div>
//   );
// };

// export default Home;
