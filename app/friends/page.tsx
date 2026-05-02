import type { Metadata } from "next";
import { authOptions } from "../lib/auth/auth-options";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import {
    getFriendsWithRooms,
    getIncomingRequests,
    getOutgoingRequests,
} from "../lib/db/friends";
import FriendsList from "./friends-list";

export const metadata: Metadata = {
    title: "Friends",
    description: "Manage friend requests and jump into your friends' public FocusRoom rooms.",
    robots: { index: false, follow: false },
    alternates: { canonical: "/friends" },
};

export default async function FriendsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/signin?callbackUrl=/friends");
    }
    const me = Number(session.user.id);
    const friends = getFriendsWithRooms(me);
    const incoming = getIncomingRequests(me);
    const outgoing = getOutgoingRequests(me);

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-8 md:mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Friends</h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl mx-auto">
                        Manage requests, jump into a friend&apos;s public room, or trim your list.
                    </p>
                </header>
                <FriendsList friends={friends} incoming={incoming} outgoing={outgoing} />
            </div>
        </div>
    );
}
