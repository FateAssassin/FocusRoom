"use client"
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NotFound() {
  const { data: session } = useSession();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-gray-500 text-lg mb-6">Page Not Found</p>
            {session ? (
                <Link href="/rooms" className="button-main">
                    Go to Rooms
                </Link> 
            ) : (
                <Link href="/signin" className="button-main">
                    Get Started
                </Link>
            )}
        </div>
    )
}