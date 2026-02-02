"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLogin from "../AdminLogin";

export default function LandingHeader() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    return (
        <div className="bg-[#F3ECF8] pb-6">
            {/* Header started here */}
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
                    <div className="flex items-center">
                        <Link href="/">
                            <img
                                src="/assets/images/tiameds.logo.png"
                                alt="Company logo"
                                width={230}
                                height={40}
                                className="transition-transform duration-200 hover:scale-110"
                            />
                        </Link>
                    </div>

                    {/* Seller & Buyer */}
                    <nav className="flex items-center gap-15 font-sans text-base font-medium text-[#0A0A0B] ml-auto mr-30">
                        {/* Text buttons */}
                        <Link
                            href="/seller_7a3b9f2c"
                            className="
                                text-[18px] font-semibold text-[#2D0066]
                                transition-all duration-200
                                hover:text-[#751bb5]
                                hover:scale-90
                                hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
                            "
                        >
                            Become a Seller
                        </Link>

                        <Link
                            href="/buyer_e8d45a1b"
                            className="
                                text-[18px] font-semibold text-[#2D0066]
                                transition-all duration-200
                                hover:text-[#751bb5]
                                hover:scale-90
                                hover:[text-shadow:0_1px_24px_rgba(117,27,181,0.45)]
                            "
                        >
                            Become a Buyer
                        </Link>
                    </nav>

                    {/* Menu Icon */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="text-3xl font-bold text-[#4B0082] transition-all duration-200 hover:text-[#751bb5] hover:scale-110 mr-5"
                    >
                        ☰
                    </button>
                </div>
            </header>

            {/* Admin Login Modal */}
            {showAdminLogin && (
                <AdminLogin onClose={() => setShowAdminLogin(false)} />
            )}

            {/* Overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Side Drawer */}
            <div
                className={`fixed top-0 right-0 h-screen w-72 bg-[#f4f2f7] shadow-2xl z-50 transform transition-transform duration-300 ${
                    menuOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex justify-end p-4 border-b">
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="text-2xl transition hover:text-red-500 hover:scale-110"
                    >
                        ✕
                    </button>
                </div>

                <nav className="flex flex-col text-lg font-semibold text-[#2D0066]">
                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
                    >
                        Home
                    </Link>

                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
                    >
                        About
                    </Link>

                    <Link
                        href="/"
                        onClick={() => setMenuOpen(false)}
                        className="px-8 py-4 border-b hover:bg-[#F3ECF8] hover:text-[#751bb5] hover:scale-97 transition"
                    >
                        Login
                    </Link>

                    {/* Admin Login Button */}
                    <button
                        onClick={() => {
                            setMenuOpen(false);
                            setShowAdminLogin(true);
                        }}
                        className="
                            px-8 py-4 border-b 
                            text-left text-lg font-semibold text-[#2D0066]
                            hover:bg-[#F3ECF8] hover:text-[#751bb5] 
                            hover:scale-97 transition
                        "
                    >
                        Login as Admin
                    </button>
                </nav>
            </div>
        </div>
    );
}