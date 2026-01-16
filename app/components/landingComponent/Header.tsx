import Link from 'next/link'

export default function Header() {
    return (
        <div className="bg-[#F3ECF8] pb-6">
            {/* Header started here */}
            <header
                className="
                    mx-auto w-full
                    rounded-[10px]
                    border border-[#eaeaea]
                    bg-[rgba(250,250,250,0.64)]
                    shadow-[0_0_12px_rgba(0,0,0,0.10)]
                    backdrop-blur-md
                "
            >
                <div className="flex items-center justify-between px-6">
                    {/* Logo */}
                    <div className="flex items-center">
                        <img
                            src="/assets/images/tiameds.logo.png"
                            alt="Company logo"
                            width={230}
                            height={40}
                            className="transition-transform duration-200 hover:scale-110"
                        />
                    </div>

                    {/* Actions */}
                    <nav className="flex items-center gap-20 font-sans text-base font-medium text-[#0A0A0B] pr-20">
                        {/* Text buttons */}
                        <Link
                            href="/seller"
                            className="
                                text-[18px] font-semibold text-[#2D0066]
                                transition-all duration-200
                                hover:text-[#751bb5]
                                hover:scale-90
                                hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
                            "
                        >
                            Become a seller
                        </Link>

                        <Link
                            href="/buyer"
                            className="
                                text-[18px] font-semibold text-[#2D0066]
                                transition-all duration-200
                                hover:text-[#751bb5]
                                hover:scale-90
                                hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
                            "
                        >
                            Become a buyer
                        </Link>


                        {/* Login button */}
                        <button
                            className="
                                px-8 py-2
                                text-white font-semibold
                                rounded-lg
                                bg-[#4B0082]
                                transition-all duration-200 ease-out
                                hover:bg-[#751bb5]
                                hover:scale-90
                                hover:shadow-[0_8px_24px_rgba(117,27,181,0.35)]
                            "
                        >
                            Login
                        </button>
                    </nav>
                </div>
            </header>
            {/* Header ended here */}</div>
    )
}
