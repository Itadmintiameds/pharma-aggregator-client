import React from "react";
import Header from "../landingComponent/Header";
import ImageSlider from "../ImageSlider";

const Landing = () => {
  return (
    <div className="bg-[#F3ECF8] pt-18">
      <Header />

      <section className="mx-auto mt-10 w-4/5 space-y-12">

        {/* Heading + paragraph stacked */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold leading-tight text-[#0A0A0B]">
            CONNECT VERIFIED 
            PHARMA <span className="text-[#9A6AFF]">BUYERS </span>
            & <span className="text-[#F5B942]">SELLERS</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
            Streamline operations, boost visibility, and ensure timely, safe
            medication delivery with our pharma supply chain platform
          </p>
        </div>

        {/* Full-width image slider */}
        <ImageSlider />
        <br /><br />

      </section>
    </div>
  );
};

export default Landing;
