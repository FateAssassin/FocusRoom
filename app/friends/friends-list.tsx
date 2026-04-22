"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { removeFriendAction } from "@/app/lib/actions";

type FriendRoom = {
    id: number;
    name: string;
    description: string | null;
    publicity: string;
    invite_code: string;
};

type Friend = {
    id: number;
    name: string;
    profile_picture_link: string | null;
    description: string | null;
    room: FriendRoom | null;
};

export default function FriendsList({ friends: initial }: { friends: Friend[] }) {
    const [friends, setFriends] = useState(initial);
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    function onRemove(friendId: number) {
        setError(null);
        setPendingId(friendId);
        startTransition(async () => {
            const result = await removeFriendAction(friendId);
            if (result.error) {
                setError(result.error);
                setPendingId(null);
                return;
            }
            setFriends((f) => f.filter((x) => x.id !== friendId));
            setPendingId(null);
        });
    }

    if (friends.length === 0) {
        return (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: "rgba(43, 127, 255, 0.1)" }}
                >
                    <i className="bi bi-person-hearts text-2xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                </div>
                <h3 className="font-semibold text-gray-900">No friends yet</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Visit a profile and hit &ldquo;Add as Friend&rdquo; to start building your list.
                </p>
            </div>
        );
    }

    return (
        <>
            {error ? <p className="text-sm text-red-500 mb-3">{error}</p> : null}
            <ul className="grid gap-4 sm:grid-cols-2">
                {friends.map((f) => {
                    const isPending = pendingId === f.id;
                    const canJoin = f.room && f.room.publicity === "public";
                    return (
                        <li
                            key={f.id}
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                {f.profile_picture_link ? (
                                    <img
                                        src={f.profile_picture_link}
                                        alt={`${f.name}'s profile picture`}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                                        style={{ background: "linear-gradient(135deg, rgb(43, 127, 255), rgb(100, 160, 255))" }}
                                    >
                                        {f.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <Link
                                        href={`/profile/${f.id}`}
                                        className="font-semibold text-gray-900 hover:underline block truncate"
                                    >
                                        {f.name}
                                    </Link>
                                    {f.description ? (
                                        <p className="text-xs text-gray-500 line-clamp-1">{f.description}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 mb-3">
                                {f.room ? (
                                    <span className="inline-flex items-center gap-1">
                                        <i className="bi bi-door-open"></i>
                                        Hosting{" "}
                                        <span className="font-medium text-gray-700">{f.room.name}</span>
                                        <span className="text-gray-400">({f.room.publicity})</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 italic">
                                        <i className="bi bi-moon-stars"></i>
                                        No active room.
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                {canJoin && f.room ? (
                                    <Link
                                        href={`/rooms/${f.room.id}`}
                                        className="button-main text-sm flex-1 inline-flex items-center justify-center"
                                    >
                                        <i className="bi bi-box-arrow-in-right mr-2"></i>
                                        Join room
                                    </Link>
                                ) : null}
                                <button
                                    onClick={() => onRemove(f.id)}
                                    disabled={isPending}
                                    className="button-secondary text-sm flex-1 inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <i className="bi bi-person-dash mr-2"></i>
                                    {isPending ? "Removing..." : "Remove"}
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
