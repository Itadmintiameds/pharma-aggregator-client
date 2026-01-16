import React from 'react'
import Header from '../landingComponent/Header'

const  Landing = () => {
    return (
        <div className="bg-[#F3ECF8] ">
            {/* // Header component call */}
            <Header />   
            {/* Section start here */}
            <section className="mx-auto mt-20 w-4/5">
                <div className="grid grid-cols-2 items-center gap-16">

                    {/* Left section */}
                    <div className="space-y-6">
                        <h1 className="text-6xl font-bold leading-tight text-[#0A0A0B]">
                            CONNECT VERIFIED <br />
                            PHARMA <span className="text-[#9A6AFF]">BUYERS</span> <br />
                            & <span className="text-[#F5B942]">SELLERS</span>
                        </h1>

                        <p className="max-w-xl text-lg leading-relaxed text-gray-700">
                            Streamline operations, boost visibility, and ensure timely, safe
                            medication delivery with our pharma supply chain platform
                        </p>
                    </div>

                    {/* Right section */}
                    <div className="flex justify-end">
                        <video
                            src="/assets/videos/Hero section video.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full max-w-xl"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>

                </div>
            </section>

        </div>
    )
}

export default Landing