"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
            <h1 className="text-6xl font-bold mb-4">Oops</h1>
            <p className="text-gray-500 text-lg mb-2">Something went wrong creating your room.</p>
            {error?.message ? (
                <p className="text-sm text-gray-400 mb-6 max-w-md text-center wrap-break-word">{error.message}</p>
            ) : (
                <p className="mb-6" />
            )}
            <button onClick={() => unstable_retry()} className="button-main mb-2">
                Try again
            </button>
            <Link href="/rooms" className="button-secondary">
                Back to Rooms
            </Link>
        </div>
    );
}