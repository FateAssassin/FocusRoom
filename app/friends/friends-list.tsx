"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
    acceptFriendRequestAction,
    cancelFriendRequestAction,
    declineFriendRequestAction,
    removeFriendAction,
    type FriendActionResult,
} from "@/app/lib/actions";

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

type PendingRequest = {
    id: number;
    name: string;
    profile_picture_link: string | null;
    description: string | null;
    created_at: string;
};

export default function FriendsList({
    friends: initialFriends,
    incoming: initialIncoming,
    outgoing: initialOutgoing,
}: {
    friends: Friend[];
    incoming: PendingRequest[];
    outgoing: PendingRequest[];
}) {
    const [friends, setFriends] = useState(initialFriends);
    const [incoming, setIncoming] = useState(initialIncoming);
    const [outgoing, setOutgoing] = useState(initialOutgoing);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    function run(
        key: string,
        action: () => Promise<FriendActionResult>,
        onSuccess: () => void,
    ) {
        setError(null);
        setPendingId(key);
        startTransition(async () => {
            const result = await action();
            if (result.error) {
                setError(result.error);
                setPendingId(null);
                return;
            }
            onSuccess();
            setPendingId(null);
        });
    }

    const isBusy = (key: string) => pendingId === key;

    return (
        <div className="space-y-8">
            {error ? (
                <p className="text-sm text-red-500 text-center">{error}</p>
            ) : null}

            {/* Incoming requests */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Incoming requests</h2>
                    {incoming.length > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold text-white bg-red-500">
                            {incoming.length}
                        </span>
                    ) : null}
                </div>
                {incoming.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No new requests.</p>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {incoming.map((u) => {
                            const acceptKey = `accept-${u.id}`;
                            const declineKey = `decline-${u.id}`;
                            return (
                                <li
                                    key={u.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3"
                                >
                                    <Avatar user={u} size={44} />
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/profile/${u.id}`}
                                            className="font-semibold text-gray-900 hover:underline block truncate"
                                        >
                                            {u.name}
                                        </Link>
                                        <p className="text-xs text-gray-500">wants to be your friend</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                run(
                                                    acceptKey,
                                                    () => acceptFriendRequestAction(u.id),
                                                    () => {
                                                        setIncoming((arr) => arr.filter((x) => x.id !== u.id));
                                                        setFriends((arr) => [
                                                            ...arr,
                                                            {
                                                                id: u.id,
                                                                name: u.name,
                                                                profile_picture_link: u.profile_picture_link,
                                                                description: u.description,
                                                                room: null,
                                                            },
                                                        ]);
                                                    },
                                                )
                                            }
                                            disabled={isBusy(acceptKey) || isBusy(declineKey)}
                                            className="button-main text-xs px-3 py-1.5 inline-flex items-center justify-center disabled:opacity-60"
                                            aria-label={`Accept request from ${u.name}`}
                                        >
                                            <i className="bi bi-check-lg"></i>
                                        </button>
                                        <button
                                            onClick={() =>
                                                run(
                                                    declineKey,
                                                    () => declineFriendRequestAction(u.id),
                                                    () => setIncoming((arr) => arr.filter((x) => x.id !== u.id)),
                                                )
                                            }
                                            disabled={isBusy(acceptKey) || isBusy(declineKey)}
                                            className="button-secondary text-xs px-3 py-1.5 inline-flex items-center justify-center disabled:opacity-60"
                                            aria-label={`Decline request from ${u.name}`}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Outgoing requests */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sent requests</h2>
                {outgoing.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">You haven&apos;t sent any requests.</p>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {outgoing.map((u) => {
                            const cancelKey = `cancel-${u.id}`;
                            return (
                                <li
                                    key={u.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3"
                                >
                                    <Avatar user={u} size={44} />
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/profile/${u.id}`}
                                            className="font-semibold text-gray-900 hover:underline block truncate"
                                        >
                                            {u.name}
                                        </Link>
                                        <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                                            <i className="bi bi-hourglass-split"></i> Pending
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            run(
                                                cancelKey,
                                                () => cancelFriendRequestAction(u.id),
                                                () => setOutgoing((arr) => arr.filter((x) => x.id !== u.id)),
                                            )
                                        }
                                        disabled={isBusy(cancelKey)}
                                        className="button-secondary text-xs px-3 py-1.5 inline-flex items-center justify-center disabled:opacity-60"
                                    >
                                        {isBusy(cancelKey) ? "..." : "Cancel"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Friends */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Your friends
                    <span className="text-gray-400 font-normal text-sm ml-2">({friends.length})</span>
                </h2>
                {friends.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                            style={{ backgroundColor: "rgba(43, 127, 255, 0.1)" }}
                        >
                            <i className="bi bi-person-hearts text-2xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">No friends yet</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Visit a profile and hit &ldquo;Add as Friend&rdquo; to send a request.
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {friends.map((f) => {
                            const removeKey = `remove-${f.id}`;
                            const canJoin = f.room && f.room.publicity === "public";
                            return (
                                <li
                                    key={f.id}
                                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar user={f} size={48} />
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
                                            onClick={() =>
                                                run(
                                                    removeKey,
                                                    () => removeFriendAction(f.id),
                                                    () => setFriends((arr) => arr.filter((x) => x.id !== f.id)),
                                                )
                                            }
                                            disabled={isBusy(removeKey)}
                                            className="button-secondary text-sm flex-1 inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <i className="bi bi-person-dash mr-2"></i>
                                            {isBusy(removeKey) ? "Removing..." : "Remove"}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Avatar({
    user,
    size,
}: {
    user: { name: string; profile_picture_link: string | null };
    size: number;
}) {
    if (user.profile_picture_link) {
        return (
            <img
                src={user.profile_picture_link}
                alt={`${user.name}'s profile picture`}
                className="rounded-full object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{
                width: size,
                height: size,
                fontSize: Math.floor(size / 2.4),
                background: "linear-gradient(135deg, rgb(43, 127, 255), rgb(100, 160, 255))",
            }}
        >
            {user.name?.charAt(0).toUpperCase()}
        </div>
    );
}
