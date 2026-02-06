"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaHome, FaArrowLeft, FaChartLine} from 'react-icons/fa';

type HeaderProps = {
    admin?: boolean;
    onLogout?: () => void;
};

const Header =({ admin = false }: HeaderProps) => {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    
    return (
        <>
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-neutral-200 shadow-sm">
                <div className="mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group shrink-0">
                            <div className="relative h-14 w-48 sm:h-16 sm:w-56 lg:h-18 lg:w-64">
                                <Image
                                    src="/assets/images/tiameds.logo.png"
                                    alt="TiaMeds Technologies"
                                    fill
                                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                                    priority
                                />
                            </div>
                        </Link>

                        {/* Desktop Navigation - Right side */}
                        <nav className="hidden lg:flex items-center space-x-6 ml-auto mr-6">
                            {admin ? (
                                <>
                                    {/* Back */}
                                    <button
                                        onClick={() => router.back()}
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            <FaArrowLeft className="mr-2" />
                                            Back
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </button>

                                    {/* Admin Home */}
                                    <Link
                                        href="/admin_f6c29e3d"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            <FaHome className="mr-2" />
                                            Home
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>

                                    {/* Tiameds Main Site */}
                                    <Link
                                        href="/"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        Tiameds
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>

                                    {/* Admin Insights */}
                                    <Link
                                        href="/admin_f6c29e3d"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            <FaChartLine className="mr-2" />
                                            Admin Insights
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            Home
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>

                                    <Link
                                        href="/seller_7a3b9f2c"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            FAQs
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>

                                    <Link
                                        href="/seller_7a3b9f2c"
                                        className="group relative px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200"
                                    >
                                        <span className="flex items-center">
                                            Contact Info
                                        </span>
                                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                            aria-label="Open menu"
                        >
                            <FiMenu className="w-6 h-6 text-neutral-700" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-20"></div>

            {/* Mobile Menu Overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Mobile Side Drawer */}
            <div
                className={`fixed top-0 right-0 h-screen w-72 bg-white z-50 transform transition-transform duration-300 ease-out lg:hidden ${
                    menuOpen ? "translate-x-0" : "translate-x-full"
                } shadow-xl`}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                    <div className="h-8 w-32 relative">
                        <Image
                            src="/assets/images/tiameds.logo.png"
                            alt="TiaMeds"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        aria-label="Close menu"
                    >
                        <FiX className="w-5 h-5 text-neutral-700" />
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className="p-4">
                    <nav className="space-y-1 mb-8">
                        {admin ? (
                            <>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        router.back();
                                    }}
                                    className="w-full flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    <FaArrowLeft className="mr-3" />
                                    Back
                                </button>
                                <Link
                                    href="/admin_f6c29e3d"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Tiameds
                                </Link>
                                <Link
                                    href="/admin_f6c29e3d"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Admin Insights
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Home
                                </Link>
                                <Link
                                    href="/seller_7a3b9f2c"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    FAQs
                                </Link>
                                <Link
                                    href="/seller_7a3b9f2c"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                    Contact Info
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Footer in Mobile Menu */}
                    <div className="mt-8 pt-6 border-t border-neutral-100">
                        <p className="text-neutral-500 text-sm text-center px-2">
                            Transforming healthcare through innovative technology
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header;























// original code with headers;-.........................
// "use client";
// import Link from 'next/link';
// import { useRouter } from "next/navigation";

// type HeaderProps = {
//     admin?: boolean;
//     onLogout?: () => void;
// };

// export default function Header({ admin = false, onLogout }: HeaderProps) {
//     const router = useRouter();
//     return (
//         <div className="bg-[#F3ECF8] pb-6">
//             <header
//                 className="
//                     fixed top-0 left-0 z-50
//                     w-full
//                     border border-[#eaeaea]
//                     bg-[#f4f2f7]
//                     shadow-[0_0_12px_rgba(0,0,0,0.10)]
//                 "
//             >
//                 <div className="flex items-center justify-between px-6">
//                     {/* Logo */}
//                     <Link href={"/"}>
//                         <div className="flex items-center">
//                             <img
//                                 src="/assets/images/tiameds.logo.png"
//                                 alt="Company logo"
//                                 width={230}
//                                 height={40}
//                                 className="transition-transform duration-200 hover:scale-110"
//                             />
//                         </div>
//                     </Link>

//                     {/* Actions */}
//                     <nav className="flex items-center gap-20 font-sans text-base font-medium text-[#0A0A0B] pr-20">

//                         {admin ? (
//                             <>
//                                 {/* Back */}
//                                 <button
//                                     onClick={() => router.back()}
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Back
//                                 </button>

//                                 {/* Admin Home */}
//                                 <Link
//                                     href="/admin_f6c29e3d"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Home
//                                 </Link>

//                                 {/* Tiameds Main Site */}
//                                 <Link
//                                     href="/"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Tiameds
//                                 </Link>

//                                 {/* Admin Insights */}
//                                 <Link
//                                     href="/admin_f6c29e3d"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Admin Insights
//                                 </Link>
//                                 {/* Logout */}
//                                 <button
//                                     onClick={onLogout}
//                                         className="
//                                             px-6 py-2
//                                             text-white font-semibold
//                                             rounded-lg
//                                             bg-[#4B0082]
//                                             transition-all duration-200
//                                             hover:bg-[#751bb5]
//                                             hover:scale-90
//                                             hover:shadow-[0_0_18px_rgba(117,27,181,0.45)]
//                                         "
//                                 >
//                                     Logout
//                                 </button>
//                             </>
//                         ) : (
//                             <>
//                                 <Link
//                                     href="/"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Home
//                                 </Link>

//                                 <Link
//                                     href="/seller_7a3b9f2c"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     FAQs
//                                 </Link>

//                                 <Link
//                                     href="/seller_7a3b9f2c"
//                                     className="
//                                         text-[18px] font-semibold text-[#2D0066]
//                                         transition-all duration-200
//                                         hover:text-[#751bb5]
//                                         hover:scale-90
//                                         hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                                     "
//                                 >
//                                     Contact Info
//                                 </Link>
//                             </>
//                         )}

//                     </nav>

//                 </div>
//             </header>
//         </div>
//     )
// }
