"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/src/app/commonComponents/Button";
import { FiMenu, FiX } from "react-icons/fi";



const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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
            <div className="hidden lg:flex items-center gap-4">

              {[1, 2, 3, 4].map((item) => (
                <Button
                  key={item}
                  variant="text"
                  size="sm"
                  shape="round"
                  label="Home"
                  icon={
                    <Image
                      src="/icons/home.svg"
                      alt="Home"
                      width={16}
                      height={16}
                    />
                  }
                  iconPosition="left"
                  className="w-23.75"
                />
              ))}

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

          {[1, 2, 3, 4].map((item) => (
            <Button
              key={item}
              variant="text"
              size="md"
              shape="round"
              label="Home"
              icon={
                <Image
                  src="/icons/home.svg"
                  alt="Home"
                  width={18}
                  height={18}
                />
              }
              iconPosition="left"
              className="w-full justify-start"
            />
          ))}

        </div>
      </div>
    </>
  );
};

export default Header;