"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { deleteMyRoomAction, updateMyRoomAction } from "@/app/lib/actions";

type Member = {
    socketId: string;
    userId: number;
    name: string;
    pic: string | null;
};

type TimerSnapshot = {
    phase: "focus" | "break";
    durationMs: number;
    remainingMs: number;
    running: boolean;
};

type ChatMessage = {
    fromId: number;
    fromName: string;
    text: string;
    ts: number;
};

type RoomProps = {
    id: number;
    hostId: number;
    name: string;
    description: string | null;
    publicity: string;
    maxMembers: number | null;
    inviteCode: string | null;
    createdAt: string;
};

type MeProps = {
    id: number;
    name: string;
    pic: string | null;
};

export default function RoomView({ room, me }: { room: RoomProps; me: MeProps }) {
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);

    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [timer, setTimer] = useState<TimerSnapshot>({
        phase: "focus",
        durationMs: 25 * 60 * 1000,
        remainingMs: 25 * 60 * 1000,
        running: false,
    });
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [durationMin, setDurationMin] = useState(25);
    const [phase, setPhase] = useState<"focus" | "break">("focus");

    const isHost = me.id === room.hostId;
    const chatScrollRef = useRef<HTMLDivElement | null>(null);

    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [updating, startUpdate] = useTransition();
    const [deleting, startDelete] = useTransition();
    const [chatHidden, setChatHidden] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem("focusroom:chatHidden");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved === "1") setChatHidden(true);
    }, []);

    const toggleChatHidden = () => {
        setChatHidden((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                window.localStorage.setItem("focusroom:chatHidden", next ? "1" : "0");
            }
            return next;
        });
    };

    const copyInvite = () => {
        if (!room.inviteCode) return;
        navigator.clipboard.writeText(room.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const onDelete = () => {
        if (!confirm("Delete this room? This cannot be undone.")) return;
        setDeleteError(null);
        startDelete(async () => {
            const result = await deleteMyRoomAction();
            if (result.error) {
                setDeleteError(result.error);
                return;
            }
            router.push("/rooms");
        });
    };

    const onUpdate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setUpdateError(null);
        startUpdate(async () => {
            const result = await updateMyRoomAction(undefined, formData);
            if (result.error) {
                setUpdateError(result.error);
                return;
            }
            setEditing(false);
            router.refresh();
        });
    };

    useEffect(() => {
        const socket = io({
            path: "/api/socket",
            transports: ["websocket", "polling"],
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("room:join", { roomId: room.id });
        });
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect_error", (err) => {
            setError(err.message === "unauthenticated" ? "You must sign in." : "Connection failed.");
        });

        socket.on("room:state", (payload: {
            roomId: number;
            hostId: number;
            members: Member[];
            timer: TimerSnapshot;
        }) => {
            setMembers(payload.members);
            setTimer(payload.timer);
            setDurationMin(Math.max(1, Math.round(payload.timer.durationMs / 60000)));
            setPhase(payload.timer.phase);
        });

        socket.on("room:error", (code: string) => {
            const msg =
                code === "room-not-found"
                    ? "This room no longer exists."
                    : code === "room-full"
                    ? "This room is full."
                    : "Could not join room.";
            setError(msg);
        });

        socket.on("member:joined", (m: Member) => {
            setMembers((prev) => (prev.some((x) => x.socketId === m.socketId) ? prev : [...prev, m]));
        });
        socket.on("member:left", ({ socketId }: { socketId: string }) => {
            setMembers((prev) => prev.filter((m) => m.socketId !== socketId));
        });

        socket.on("timer:tick", (snap: TimerSnapshot) => {
            setTimer(snap);
        });

        socket.on("chat:message", (msg: ChatMessage) => {
            setChat((prev) => [...prev.slice(-199), msg]);
        });

        socket.on("kicked", () => {
            setError("You were removed from the room.");
            setTimeout(() => router.push("/rooms"), 1200);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [room.id, router]);

    useEffect(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight });
    }, [chat.length]);

    const remaining = useMemo(() => formatMs(timer.remainingMs), [timer.remainingMs]);

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text) return;
        socketRef.current?.emit("chat:send", { text });
        setChatInput("");
    };

    const setTimerOnServer = () => {
        if (!isHost) return;
        socketRef.current?.emit("timer:set", { durationMin, phase });
    };
    const startTimer = () => isHost && socketRef.current?.emit("timer:start");
    const pauseTimer = () => isHost && socketRef.current?.emit("timer:pause");
    const resetTimer = () => isHost && socketRef.current?.emit("timer:reset");
    const kick = (userId: number) => {
        if (!isHost || userId === room.hostId) return;
        socketRef.current?.emit("user:kick", { userId });
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <i className="bi bi-door-open text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{room.name}</h1>
                            <span
                                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor:
                                        room.publicity === "private"
                                            ? "rgba(107, 114, 128, 0.12)"
                                            : "rgba(43, 127, 255, 0.12)",
                                    color:
                                        room.publicity === "private"
                                            ? "rgb(75, 85, 99)"
                                            : "rgb(43, 127, 255)",
                                }}
                            >
                                {room.publicity}
                            </span>
                        </div>
                        {room.description ? (
                            <p className="text-gray-500 text-sm">{room.description}</p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                                connected ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                            }`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}
                            ></span>
                            {connected ? "Live" : "Connecting..."}
                        </span>
                    </div>
                </header>

                {error ? (
                    <div className="card mb-4 bg-red-50 border-red-200 text-red-700">{error}</div>
                ) : null}

                <section className="card mb-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1">
                                <i className={`bi ${room.publicity === "private" ? "bi-lock-fill" : "bi-globe"}`}></i>
                                <span className="capitalize">{room.publicity}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-key"></i>
                                <span className="text-gray-500">Invite:</span>
                                <button
                                    type="button"
                                    onClick={copyInvite}
                                    disabled={!room.inviteCode}
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                    title={room.inviteCode ? "Copy invite code" : ""}
                                >
                                    {copied ? (
                                        <span className="text-xs text-white px-2 py-0.5 rounded-md bg-green-500">
                                            <i className="bi bi-clipboard"></i> Copied!
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-700 font-mono px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200">
                                            {room.inviteCode ?? "—"}
                                        </span>
                                    )}
                                </button>
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-people"></i>
                                {room.maxMembers ? `Up to ${room.maxMembers}` : "Unlimited"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <i className="bi bi-calendar3"></i>
                                Created {formatDate(room.createdAt)}
                            </span>
                        </div>
                        {isHost ? (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing((e) => !e)}
                                    className="button-main bg-green-500 hover:bg-green-600 text-sm inline-flex items-center"
                                >
                                    <i className={`bi ${editing ? "bi-x-lg" : "bi-pencil"} mr-2`}></i>
                                    {editing ? "Cancel" : "Edit"}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={deleting}
                                    className="button-main bg-red-400 hover:bg-red-500 text-sm inline-flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <i className="bi bi-trash mr-2"></i>
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {deleteError ? (
                        <p className="text-sm text-red-500 mt-2">{deleteError}</p>
                    ) : null}
                    {editing && isHost ? (
                        <form onSubmit={onUpdate} className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                <input
                                    name="name"
                                    defaultValue={room.name}
                                    required
                                    maxLength={80}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    defaultValue={room.description ?? ""}
                                    rows={2}
                                    maxLength={300}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Publicity</label>
                                    <select
                                        name="publicity"
                                        defaultValue={room.publicity}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Max members</label>
                                    <input
                                        name="max_members"
                                        type="number"
                                        min={1}
                                        defaultValue={room.maxMembers ?? ""}
                                        placeholder="Unlimited"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={updating}
                                className="button-main w-full inline-flex items-center justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <i className={`bi ${updating ? "bi-arrow-repeat animate-spin" : "bi-check-lg"} mr-2`}></i>
                                {updating ? "Saving..." : "Save changes"}
                            </button>
                            {updateError ? (
                                <p className="text-sm text-red-500">{updateError}</p>
                            ) : null}
                        </form>
                    ) : null}
                </section>

                <div className="grid gap-4 lg:grid-cols-[240px_1fr_300px]">
                    <aside className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <i className="bi bi-people text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                            <h2 className="text-lg font-semibold">
                                People{" "}
                                <span className="text-sm text-gray-400 font-normal">
                                    ({members.length}
                                    {room.maxMembers ? `/${room.maxMembers}` : ""})
                                </span>
                            </h2>
                        </div>
                        <ul className="space-y-2">
                            {members.map((m) => (
                                <li
                                    key={m.socketId}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden shrink-0">
                                        {m.pic ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={m.pic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            m.name.slice(0, 1).toUpperCase()
                                        )}
                                    </div>
                                    <span className="truncate flex-1">{m.name}</span>
                                    {m.userId === room.hostId ? (
                                        <i
                                            className="bi bi-star-fill text-xs"
                                            style={{ color: "rgb(234, 179, 8)" }}
                                            title="Host"
                                        ></i>
                                    ) : null}
                                    {isHost && m.userId !== room.hostId ? (
                                        <button
                                            onClick={() => kick(m.userId)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                            title="Kick"
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    ) : null}
                                </li>
                            ))}
                            {members.length === 0 ? (
                                <li className="text-sm text-gray-400 italic">Nobody here yet.</li>
                            ) : null}
                        </ul>
                    </aside>

                    <section className="card flex flex-col items-center justify-center text-center py-10">
                        <div
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full mb-4"
                            style={{
                                backgroundColor:
                                    timer.phase === "focus"
                                        ? "rgba(43, 127, 255, 0.12)"
                                        : "rgba(34, 197, 94, 0.12)",
                                color:
                                    timer.phase === "focus"
                                        ? "rgb(43, 127, 255)"
                                        : "rgb(22, 163, 74)",
                            }}
                        >
                            <i className={`bi ${timer.phase === "focus" ? "bi-brightness-high" : "bi-cup-hot"}`}></i>
                            {timer.phase}
                        </div>
                        <div className="text-6xl md:text-7xl font-mono font-bold text-gray-900 tabular-nums">
                            {remaining}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                            {timer.running ? "Running" : "Paused"}
                        </div>

                        {isHost ? (
                            <div className="mt-6 w-full max-w-sm space-y-3">
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={startTimer} className="button-main inline-flex items-center text-sm">
                                        <i className="bi bi-play-fill mr-1"></i> Start
                                    </button>
                                    <button onClick={pauseTimer} className="button-secondary inline-flex items-center text-sm">
                                        <i className="bi bi-pause-fill mr-1"></i> Pause
                                    </button>
                                    <button onClick={resetTimer} className="button-secondary inline-flex items-center text-sm">
                                        <i className="bi bi-arrow-counterclockwise mr-1"></i> Reset
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <select
                                        value={phase}
                                        onChange={(e) => setPhase(e.target.value as "focus" | "break")}
                                        className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white"
                                    >
                                        <option value="focus">Focus</option>
                                        <option value="break">Break</option>
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        max={180}
                                        value={durationMin}
                                        onChange={(e) =>
                                            setDurationMin(Math.max(1, Math.min(180, Number(e.target.value) || 1)))
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                    />
                                    <span className="text-sm text-gray-500">min</span>
                                    <button
                                        onClick={setTimerOnServer}
                                        className="button-secondary inline-flex items-center text-sm"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 mt-6 italic">
                                Only the host can control the timer.
                            </p>
                        )}
                    </section>

                    <section className="card flex flex-col" style={{ minHeight: chatHidden ? 0 : 360 }}>
                        <div className="flex items-center gap-2 mb-3">
                            <i className="bi bi-chat-dots text-xl" style={{ color: "rgb(43, 127, 255)" }}></i>
                            <h2 className="text-lg font-semibold flex-1">Chat</h2>
                            <button
                                type="button"
                                onClick={toggleChatHidden}
                                className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
                                title={chatHidden ? "Show chat" : "Hide chat to focus"}
                            >
                                <i className={`bi ${chatHidden ? "bi-eye" : "bi-eye-slash"}`}></i>
                                {chatHidden ? "Show" : "Hide"}
                            </button>
                        </div>
                        {chatHidden ? (
                            <p className="text-sm text-gray-400 italic">
                                Chat is hidden so you can focus. Messages still arrive in the background.
                            </p>
                        ) : (
                            <>
                                <div
                                    ref={chatScrollRef}
                                    className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3"
                                    style={{ maxHeight: 380 }}
                                >
                                    {chat.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No messages yet.</p>
                                    ) : (
                                        chat.map((m, i) => (
                                            <div key={i} className="text-sm">
                                                <span
                                                    className={`font-semibold ${
                                                        m.fromId === me.id ? "text-blue-600" : "text-gray-700"
                                                    }`}
                                                >
                                                    {m.fromName}
                                                </span>
                                                <span className="text-gray-600">: {m.text}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={sendChat} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Say something..."
                                        maxLength={500}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <button
                                        type="submit"
                                        className="button-main inline-flex items-center text-sm"
                                        disabled={!chatInput.trim() || !connected}
                                    >
                                        <i className="bi bi-send"></i>
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

function formatMs(ms: number): string {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
