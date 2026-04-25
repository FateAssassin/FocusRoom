import { getUserById } from "@/app/lib/db/users";
import { authOptions } from "@/app/lib/auth/auth-options";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { getFriendshipStatus } from "@/app/lib/db/friends";
import FriendButton from "./friend-button";


export default async function Page({ params }: { params: { id: string } }) {
    const param = await params;
    const id = param.id;
    const user = getUserById(Number(id));
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
    const isSelf = sessionUserId !== null && user ? sessionUserId === user.id : false;
    const friendshipStatus =
        sessionUserId !== null && user && !isSelf
            ? getFriendshipStatus(sessionUserId, user.id)
            : "none";

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(43, 127, 255, 0.1)" }}>
                        <i className="bi bi-person-x text-2xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800">User not found</h1>
                    <p className="text-gray-500 text-sm">This profile doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-start justify-center px-6 pt-24 pb-16">
            <div className="w-full max-w-md">
                {/* Banner */}
                <div className="h-28 rounded-t-2xl relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgb(43, 127, 255) 0%, rgb(100, 160, 255) 100%)" }}>
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-6 pb-6 shadow-sm">
                    {/* Avatar row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="ring-4 ring-white rounded-full mt-4">
                            {user.profile_picture_link ? (
                                <img
                                    src={user.profile_picture_link}
                                    alt={`${user.name}'s profile picture`}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                                    style={{ background: "linear-gradient(135deg, rgb(43, 127, 255), rgb(100, 160, 255))" }}>
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {sessionUserId !== null && !isSelf ? (
                            <FriendButton
                                targetUserId={user.id}
                                initialStatus={friendshipStatus}
                            />
                        ) : null}
                    </div>

                    {/* Name & join date */}
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "rgb(220, 220, 220)" }}>
                        {user.description ? (
                            <p className="text-gray-700 text-sm leading-relaxed">{user.description}</p>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No description provided.</p>
                        )}
                    </div>

                    {/* Rooms section */}
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgb(43, 127, 255)" }}>Rooms</h2>
                        <div className="rounded-xl p-4 text-gray-400 text-sm italic" style={{ backgroundColor: "rgb(220, 220, 220)" }}>
                            No rooms yet.
                        </div>
                    </div>
                    {isSelf && (
                        <div className="mt-6">
                            <Link href="/profile" className="button-main">
                                <i className="bi bi-pencil mr-2"></i>
                                Edit Your Own Profile
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}