"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { sellerAuthService } from "@/src/services/seller/authService";



const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(sellerAuthService.isAuthenticated());
  }, []);

  useEffect(() => {
    // Login/logout can happen without a page navigation (e.g. logging in
    // from within the registration wizard), so listen for the auth-changed
    // event instead of only checking once on mount.
    const handleAuthChanged = () => setIsLoggedIn(sellerAuthService.isAuthenticated());
    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  const handleLogout = async () => {
    // The registration wizard has its own in-progress form data worth saving
    // before logging out - it owns that state, this component doesn't, so
    // hand off to it via an event instead of logging out directly here.
    if (pathname === "/seller_7a3b9f2c") {
      setMenuOpen(false);
      window.dispatchEvent(new CustomEvent("seller-wizard-logout-request"));
      return;
    }

    await sellerAuthService.logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 w-full z-50 bg-base-white border-b border-neutral-100 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">

            {/* ================= LOGO ================= */}
            <Link
              href="/"
              className="flex items-center group shrink-0"
            >
              <div className="relative h-14 w-40 sm:h-16 sm:w-48 lg:h-16 lg:w-52">
                <Image
                  src="/assets/images/tiameds.logo.png"
                  alt="TiaMeds"
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </Link>

            {/* ================= DESKTOP NAVIGATION ================= */}
            <div className="hidden lg:flex items-center gap-6">

              {[
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-p3 font-body font-semibold text-neutral-700 hover:text-primary-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-p3 font-body font-semibold text-primary-800 hover:bg-primary-50 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              )}

            </div>

            {/* ================= MOBILE MENU BUTTON ================= */}
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

      {/* ================= SPACER ================= */}
      {/* <div className="h-20"></div> */}

      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`fixed top-0 right-0 h-screen w-72 bg-white z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } shadow-xl`}
      >

        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">

          <Link href="/" onClick={() => setMenuOpen(false)}>
            <div className="relative h-8 w-32">
              <Image
                src="/assets/images/tiameds.logo.png"
                alt="TiaMeds"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5 text-neutral-700" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="p-4 space-y-3">

          {[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 rounded-full text-p3 font-body font-semibold text-neutral-700 hover:bg-primary-50 hover:text-primary-800 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-full text-p3 font-body font-semibold text-primary-800 hover:bg-primary-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          )}

        </div>
      </div>
    </>
  );
};

export default Header;