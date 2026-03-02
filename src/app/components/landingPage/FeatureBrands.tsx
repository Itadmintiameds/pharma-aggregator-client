"use client";

import Image from "next/image";

const FeatureBrands = () => {
    const logos = [
        "/assets/images/logo1.jpg",
        "/assets/images/logo2.jpg",
        "/assets/images/logo3.jpg",
        "/assets/images/logo4.jpg",
        "/assets/images/logo5.jpg",
        "/assets/images/logo6.jpg",
    ];

    return (
        <section className="w-full xl:w-[1280px] h-[176px] mx-auto bg-neutral-50 flex flex-col items-center justify-center">

            {/* ================= HEADER ================= */}
            <div className="w-[1240px] h-[32px] flex items-center">
                <h2 className="text-h4 font-semibold text-neutral-900">
                    Featured Brands
                </h2>
            </div>

            {/* ================= LOGO MARQUEE ================= */}
            <div className="w-[1240px] h-[80px] overflow-hidden mt-6 ">

                <div className=" gap-8 brand-marquee">

                    {[...logos, ...logos].map((logo, index) => (
                        <div
                            key={index}
                            className="w-[100px] h-[80px] relative shrink-0 flex items-center justify-center"
                        >
                            <Image
                                src={logo}
                                alt={`Brand ${index + 1}`}
                                width={100}
                                height={80}
                                className="object-contain"
                            />
                        </div>
                    ))}

                </div>
            </div>

            {/* ================= MARQUEE ANIMATION ================= */}
            <style jsx>{`
  .brand-marquee {
    display: flex;
    width: max-content;
    animation: scrollBrands 15s linear infinite;
  }

  .brand-marquee:hover {
    animation-play-state: paused;
  }

  @keyframes scrollBrands {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
`}</style>

        </section>
    );
};

export default FeatureBrands;