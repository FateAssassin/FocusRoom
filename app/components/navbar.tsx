"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = status === "authenticated" ? session.user : null;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-4 px-4 sm:px-8 md:px-16 lg:px-32 shadow-md absolute w-full bg-white/95">
        <Link href="/" className="flex items-center gap-2">
          <i className="bi bi-stopwatch text-blue-500 font-bold text-2xl sm:text-3xl"></i>
          <span className="font-bold text-xl sm:text-2xl">FocusRoom</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="button-main">{user.name}</button>
              {isDropdownOpen && (
                <div className="absolute right-0  w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/friends"
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    Friends
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signup" className="button-main">
              Sign Up
            </Link>
          )}
          <Link href="/rooms" className="button-secondary">Rooms</Link>
        </div>

        {/* Mobile Menu */}
        <details className="sm:hidden relative">
          <summary className="list-none cursor-pointer text-2xl">
            <i className="bi bi-list"></i>
          </summary>
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <Link
              href="/rooms"
              className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              Rooms
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                >
                  {user.name}
                </Link>
                <Link
                    href="/friends"
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                >
                  Friends
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signup"
                className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
              >
                Sign Up
              </Link>
            )}
          </div>
        </details>
      </div>

      <hr className="text-gray-300" />
    </>
  );
}
