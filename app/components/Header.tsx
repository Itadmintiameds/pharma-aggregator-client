import Link from 'next/link';

type HeaderProps = {
    showLogout?: boolean;
    onLogout?: () => void;
};

export default function Header({ showLogout = false, onLogout }: HeaderProps) {
    return (
        <div className="bg-[#F3ECF8] pb-6">
            <header
                className="
                    fixed top-0 left-0 z-50
                    w-full
                    border border-[#eaeaea]
                    bg-[#f4f2f7]
                    shadow-[0_0_12px_rgba(0,0,0,0.10)]
                "
            >
                <div className="flex items-center justify-between px-6">
                    {/* Logo */}
                    <Link href={"/"}>
                        <div className="flex items-center">
                            <img
                                src="/assets/images/tiameds.logo.png"
                                alt="Company logo"
                                width={230}
                                height={40}
                                className="transition-transform duration-200 hover:scale-110"
                            />
                        </div>
                    </Link>

                    {/* Actions */}
                    <nav className="flex items-center gap-20 font-sans text-base font-medium text-[#0A0A0B] pr-20">
                        {/* Text buttons */}
                        <Link
                            href="/"
                            className="
                                text-[18px] font-semibold text-[#2D0066]
                                transition-all duration-200
                                hover:text-[#751bb5]
                                hover:scale-90
                                hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
                            "
                        >
                            Home
                        </Link>

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
                            FAQs
                        </Link>

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
                            Contact Info
                        </Link>

                        {showLogout && (
                            <button
                                onClick={onLogout}
                                className="
                                    px-6 py-2
                                    text-white font-semibold
                                    rounded-lg
                                    bg-[#4B0082]
                                    transition-all duration-200
                                    hover:bg-[#751bb5]
                                    hover:scale-90
                                    "
                            >
                                Logout
                            </button>
                            
                        )}

                    </nav>
                </div>
            </header>
        </div>
    )
}
