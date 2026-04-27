"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/app/components/alert";

export default function ExistingRoomRedirect({ roomId }: { roomId: number | null }) {
  const router = useRouter();
  if (roomId === null){
    return 
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push(`/room/${roomId}`);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [router, roomId]);

  return (
    <>
      <Alert message="You already have an existing room" type="error" />
      <p className="mt-4 text-sm text-gray-600">
        Redirecting to your room in 3 seconds. <a href={`/room/${roomId}`} className="text-indigo-600 underline">Click here if you are not redirected.</a>
      </p>
    </>
  );
}
