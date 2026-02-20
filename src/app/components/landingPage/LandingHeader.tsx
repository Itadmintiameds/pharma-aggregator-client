"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLogin from "../AdminLogin";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUser, FaStore, FaShoppingCart, FaSignInAlt } from "react-icons/fa";

export default function LandingHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    const navItems = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
    ];

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
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="px-4 py-2 text-neutral-700 hover:text-primary-600 font-medium text-sm transition-colors duration-200 relative group"
                                >
                                    {item.name}
                                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                </Link>
                            ))}
                        </nav>

                        {/* Desktop CTA Buttons - Right */}
                        <div className="hidden lg:flex items-center space-x-3">
                            {/* Login Button */}
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
                            >
                                <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
                                    <FaSignInAlt className="mr-2" />
                                    Login
                                </span>
                                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                            </button>

                            {/* Seller Button */}
                            <Link
                                href="/seller_7a3b9f2c"
                                className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
                            >
                                <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
                                    <FaStore className="mr-2" />
                                    Become a Seller
                                </span>
                                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                            </Link>

                            {/* Buyer Button */}
                            <Link
                                href="/buyer_e8d45a1b"
                                className="group relative px-5 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
                            >
                                <span className="flex items-center text-primary-600 group-hover:text-white font-semibold text-sm">
                                    <FaShoppingCart className="mr-2" />
                                    Become a Buyer
                                </span>
                                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                            </Link>

                            {/* Admin Login Button */}
                            {/* <button
                                onClick={() => setShowAdminLogin(true)}
                                className="group relative px-4 py-2.5 rounded-lg border border-primary-600 bg-white hover:bg-primary-600 transition-all duration-300"
                            >
                                <span className="flex items-center text-primary-600 group-hover:text-white font-medium text-sm">
                                    <FaUser className="mr-2" />
                                    Login As Admin
                                </span>
                                <div className="absolute inset-0 rounded-lg bg-primary-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                            </button> */}
                        </div>

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
            <div className="h-16"></div>

            {/* Admin Login Modal */}
            {showAdminLogin && (
                <AdminLogin onClose={() => setShowAdminLogin(false)} />
            )}

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
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center px-4 py-3 text-neutral-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile CTA Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                setShowAdminLogin(true);
                            }}
                            className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
                        >
                            <FaSignInAlt className="mr-2" />
                            Login
                        </button>

                        <Link
                            href="/seller_7a3b9f2c"
                            onClick={() => setMenuOpen(false)}
                            className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
                        >
                            <FaStore className="mr-2" />
                            Become a Seller
                        </Link>

                        <Link
                            href="/buyer_e8d45a1b"
                            onClick={() => setMenuOpen(false)}
                            className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center"
                        >
                            <FaShoppingCart className="mr-2" />
                            Become a Buyer
                        </Link>

                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                setShowAdminLogin(true);
                            }}
                            className="w-full py-3 px-4 text-center border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
                        >
                            <FaUser className="mr-2" />
                            Admin Login
                        </button>
                    </div>

                    {/* Footer in Mobile Menu */}
                    <div className="mt-8 pt-6 border-t border-neutral-100">
                        <p className="text-neutral-500 text-sm text-center px-2">
                            Transforming healthcare through innovative technology
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}















// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import AdminLogin from "../AdminLogin";

// export default function LandingHeader() {
//     const [menuOpen, setMenuOpen] = useState(false);
//     const [showAdminLogin, setShowAdminLogin] = useState(false);

//     return (
//         <div className="bg-[#F3ECF8] pb-6">
//             {/* Header started here */}
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
//                     <div className="flex items-center">
//                         <Link href="/">
//                             <img
//                                 src="/assets/images/tiameds.logo.png"
//                                 alt="Company logo"
//                                 width={230}
//                                 height={40}
//                                 className="transition-transform duration-200 hover:scale-110"
//                             />
//                         </Link>
//                     </div>

//                     {/* Seller & Buyer */}
//                     <nav className="flex items-center gap-15 font-sans text-base font-medium text-[#0A0A0B] ml-auto mr-30">
//                         {/* Text buttons */}
//                         <Link
//                             href="/seller_7a3b9f2c"
//                             className="
//                                 text-[18px] font-semibold text-[#2D0066]
//                                 transition-all duration-200
//                                 hover:text-[#751bb5]
//                                 hover:scale-90
//                                 hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                             "
//                         >
//                             Become a Seller
//                         </Link>

//                         <Link
//                             href="/buyer_e8d45a1b"
//                             className="
//                                 text-[18px] font-semibold text-[#2D0066]
//                                 transition-all duration-200
//                                 hover:text-[#751bb5]
//                                 hover:scale-90
//                                 hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
//                             "
//                         >
//                             Become a Buyer
//                         </Link>
//                     </nav>

//                     {/* Menu Icon */}
//                     <button
//                         onClick={() => setMenuOpen(true)}
//                         className="text-3xl font-bold text-[#4B0082] transition-all duration-200 hover:text-[#751bb5] hover:scale-110 mr-5"
//                     >
//                         ☰
//                     </button>
//                 </div>
//             </header>

//             {/* Admin Login Modal */}
//             {showAdminLogin && (
//                 <AdminLogin onClose={() => setShowAdminLogin(false)} />
//             )}

//             {/* Overlay */}
//             {menuOpen && (
//                 <div
//                     className="fixed inset-0 bg-black/40 z-40"
//                     onClick={() => setMenuOpen(false)}
//                 />
//             )}

//             {/* Side Drawer */}
//             <div
//                 className={`fixed top-0 right-0 h-screen w-72 bg-[#f4f2f7] shadow-2xl z-50 transform transition-transform duration-300 ${
//                     menuOpen ? "translate-x-0" : "translate-x-full"
//                 }`}
//             >
//                 <div className="flex justify-end p-4 border-b">
//                     <button
//                         onClick={() => setMenuOpen(false)}
//                         className="text-2xl transition hover:text-red-500 hover:scale-110"
//                     >
//                         ✕
//                     </button>
//                 </div>

//                 <nav className="flex flex-col text-lg font-semibold text-[#2D0066]">
//                     <Link
//                         href="/"
//                         onClick={() => setMenuOpen(false)}
//                         className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
//                     >
//                         Home
//                     </Link>

//                     <Link
//                         href="/"
//                         onClick={() => setMenuOpen(false)}
//                         className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
//                     >
//                         About
//                     </Link>

//                     <Link
//                         href="/"
//                         onClick={() => setMenuOpen(false)}
//                         className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
//                     >
//                         Login
//                     </Link>

//                     {/* Admin Login Button */}
//                     <button
//                         onClick={() => {
//                             setMenuOpen(false);
//                             setShowAdminLogin(true);
//                         }}
//                         className="
//                             px-8 py-4 border-b 
//                             text-left text-lg font-semibold text-[#2D0066]
//                             hover:bg-[#F3ECF8] hover:text-[#751bb5] 
//                             hover:scale-97 transition
//                         "
//                     >
//                         Login as Admin
//                     </button>
//                 </nav>
//             </div>
//         </div>
//     );
// }