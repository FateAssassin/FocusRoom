import { authOptions } from "../lib/auth/auth-options";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FriendsPage() {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user) {
        redirect("/signin?callbackUrl=/friends");
    }
    return (
        <div className="container mx-auto h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Friends</h1>
            <p className="text-gray-600">This is the friends page. You can manage your friends here.</p>
            {/* Add your friends list and management UI here */}
        </div>
    );
} 