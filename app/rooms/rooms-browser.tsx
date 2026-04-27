"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { joinRoomByCode, type JoinRoomState } from "@/app/lib/actions";
import { ExistingRoomBar } from "./existingRoom";

export type RoomSummary = {
    id: number;
    name: string;
    description: string | null;
    publicity: string;
    created_at: string;
    max_members: number | null;
    invite_code: string | null;
};

const INITIAL_JOIN_STATE: JoinRoomState = {};

export default function RoomsBrowser({
    rooms,
    existingRoom,
    createHref,
}: {
    rooms: RoomSummary[];
    existingRoom: RoomSummary | null;
    createHref: string;
}) {
    const [query, setQuery] = useState("");
    const [copy, setCopy] = useState(false);
    const [joinState, joinAction, joinPending] = useActionState(
        joinRoomByCode,
        INITIAL_JOIN_STATE,
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rooms;
        return rooms.filter((r) =>
            r.name.toLowerCase().includes(q) ||
            (r.description ?? "").toLowerCase().includes(q),
        );
    }, [rooms, query]);

    const copyCode = () => {
        navigator.clipboard.writeText(existingRoom?.invite_code ?? "");
        setCopy(true);
        setTimeout(() => setCopy(false), 2000);
    }

    return (
        
        <div className="grid gap-6 lg:grid-cols-3">
            <aside className="space-y-4 lg:col-span-1">
                <div className="card">
                    {existingRoom ? (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className="bi bi-door-open text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                                        <h2 className="text-lg font-semibold">You have an existing room:</h2>
                                    </div>
                                    <p>{existingRoom.name}</p>
                                    <p></p>
                                    <p className="text-sm text-gray-500">{existingRoom.description}</p>
                                    <button onClick={copyCode} className="cursor-pointer mt-1">Invite Code: &nbsp;
                                        {copy ? 
                                            <span className="text-sm text-gray-100 px-2 py-0.5 rounded-sm hover:rounded-lg duration-150 bg-green-500"><i className="bi bi-clipboard"></i> Copied!</span> : 
                                            <span className="text-sm text-gray-200 px-2 py-0.5 rounded-sm hover:rounded-lg duration-150 bg-gray-400">{existingRoom.invite_code}</span>
                                        }
                                    </button>
                                    <ExistingRoomBar
                                        room={{
                                            id: existingRoom.id,
                                            name: existingRoom.name,
                                            description: existingRoom.description,
                                            publicity: existingRoom.publicity,
                                            max_members: existingRoom.max_members,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <i className="bi bi-plus-circle text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                                <h2 className="text-lg font-semibold">Create a room</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Start a focus session and invite others to join you.
                            </p>
                            <Link
                                href={createHref}
                                className="button-main w-full inline-flex items-center justify-center text-sm"
                            >
                                <i className="bi bi-plus mr-2"></i>
                                Create Room
                            </Link>
                        </>
                    )}
                </div>

                <form action={joinAction} className="card">
                    <div className="flex items-center gap-2 mb-1">
                        <i className="bi bi-box-arrow-in-right text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                        <h2 className="text-lg font-semibold">Join by code</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Have an invite code? Drop it in to jump straight in.
                    </p>
                    <input
                        name="code"
                        type="text"
                        maxLength={6}
                        minLength={6}
                        autoComplete="off"
                        placeholder="Enter room code"
                        aria-describedby="join-error"
                        className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm uppercase bg-white placeholder:normal-case placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        type="submit"
                        disabled={joinPending}
                        className="button-secondary w-full inline-flex items-center justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <i className={`bi ${joinPending ? "bi-arrow-repeat animate-spin" : "bi-search"} mr-2`}></i>
                        {joinPending ? "Joining..." : "Join"}
                    </button>
                    {joinState?.error ? (
                        <p id="join-error" role="alert" className="text-sm text-red-500 mt-2">
                            {joinState.error}
                        </p>
                    ) : null}
                </form>
            </aside>

            <section className="lg:col-span-2">
                <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
                    <div>
                        <h2 className="text-lg font-semibold">Available rooms</h2>
                        <p className="text-sm text-gray-500">
                            {filtered.length} {filtered.length === 1 ? "room" : "rooms"}
                            {query ? ` matching "${query}"` : " open to join"}
                        </p>
                    </div>
                </div>

                <div className="relative mb-4">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search rooms..."
                        className="w-1/2 pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {filtered.length === 0 ? (
                    <EmptyState query={query} createHref={createHref} />
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {filtered.map((room) => (
                            <li key={room.id} className="h-full">
                                <RoomCard room={room} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function RoomCard({ room }: { room: RoomSummary }) {
    const isPrivate = room.publicity === "private";
    return (
        <article className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col h-full">
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 leading-tight break-words">{room.name}</h3>
                <span
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full"
                    style={{
                        backgroundColor: isPrivate ? "rgba(107, 114, 128, 0.12)" : "rgba(43, 127, 255, 0.12)",
                        color: isPrivate ? "rgb(75, 85, 99)" : "rgb(43, 127, 255)",
                    }}
                >
                    <i className={`bi ${isPrivate ? "bi-lock-fill" : "bi-globe"}`}></i>
                    {room.publicity}
                </span>
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                {room.description
                    ? room.description
                    : <span className="italic text-gray-400">No description.</span>}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-4">
                {room.max_members ? (
                    <span className="inline-flex items-center gap-1">
                        <i className="bi bi-people"></i>
                        up to {room.max_members}
                    </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                    <i className="bi bi-calendar3"></i>
                    {formatDate(room.created_at)}
                </span>
            </div>

            <Link
                href={`/room/${room.id}`}
                className="button-main text-sm text-center mt-auto inline-flex items-center justify-center"
            >
                <i className="bi bi-door-open mr-2"></i>
                Join room
            </Link>
        </article>
    );
}

function EmptyState({ query, createHref }: { query: string; createHref: string }) {
    return (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-12 text-center">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "rgba(43, 127, 255, 0.1)" }}
            >
                <i className="bi bi-door-closed text-2xl" style={{ color: "rgb(43, 127, 255)" }}></i>
            </div>
            {query ? (
                <>
                    <h3 className="font-semibold text-gray-900">No rooms match &ldquo;{query}&rdquo;</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Try a different search, or start your own session.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="font-semibold text-gray-900">No rooms yet</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Be the first to start a focus session.
                    </p>
                </>
            )}
            <Link href={createHref} className="button-main mt-4 inline-flex items-center text-sm">
                <i className="bi bi-plus mr-2"></i>
                Create a room
            </Link>
        </div>
    );
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
