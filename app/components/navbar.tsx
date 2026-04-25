"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import logo from "../logo.png";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = status === "authenticated" ? session.user : null;
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);

  const fetchIncoming = useCallback(async () => {
    if (!user) {
      setIncomingCount(0);
      return;
    }
    try {
      const res = await fetch("/api/friends/incoming-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setIncomingCount(data.count ?? 0);
    } catch {
      // ignore — transient network error
    }
  }, [user]);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming, pathname]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchIncoming, 30000);
    return () => clearInterval(interval);
  }, [user, fetchIncoming]);

  const hasRequests = incomingCount > 0;

  return (
    <>
      <div className="flex items-center justify-between p-4 px-4 sm:px-8 md:px-16 lg:px-32 shadow-md absolute w-full bg-white/95">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="FocusRoom logo"
            priority
            className="h-8 sm:h-10 w-auto"
          />
          <span className="font-bold text-xl sm:text-2xl"><span className="text-blue-500">Focus</span><span>Room</span></span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="button-main relative">
                {user.name}
                {hasRequests && (
                  <span
                    aria-label={`${incomingCount} new friend request${incomingCount === 1 ? "" : "s"}`}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"
                  />
                )}
              </button>
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
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <span>Friends</span>
                    {hasRequests && (
                      <span
                        aria-label={`${incomingCount} new friend request${incomingCount === 1 ? "" : "s"}`}
                        className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold text-white bg-red-500"
                      >
                        !
                      </span>
                    )}
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
          <summary className="list-none cursor-pointer text-2xl relative">
            <i className="bi bi-list"></i>
            {hasRequests && (
              <span
                aria-label={`${incomingCount} new friend request${incomingCount === 1 ? "" : "s"}`}
                className="absolute top-1 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"
              />
            )}
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
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 w-full text-left"
                >
                  <span>Friends</span>
                  {hasRequests && (
                    <span
                      aria-label={`${incomingCount} new friend request${incomingCount === 1 ? "" : "s"}`}
                      className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold text-white bg-red-500"
                    >
                      !
                    </span>
                  )}
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
