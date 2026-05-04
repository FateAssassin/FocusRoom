"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    adminDeleteRoomAction,
    adminDeleteUserAction,
    adminGrantAdminAction,
    adminRevokeAdminAction,
    adminUpdateRoomAction,
    adminUpdateUserAction,
    type AdminActionResult,
} from "../lib/admin-actions";

export type AdminUserRow = {
    id: number;
    name: string;
    email: string;
    description: string | null;
    created_at: string;
    profile_picture_link: string | null;
};

export type AdminRoomRow = {
    id: number;
    name: string;
    description: string | null;
    host_id: number;
    host_name: string;
    publicity: string;
    invite_code: string;
    max_members: number | null;
    created_at: string;
};

type Tab = "users" | "rooms" | "admins";
type Flash = (result: AdminActionResult, okMessage: string) => void;

export default function AdminDashboard({
    currentUserId,
    users,
    rooms,
    adminIds,
}: {
    currentUserId: number;
    users: AdminUserRow[];
    rooms: AdminRoomRow[];
    adminIds: number[];
}) {
    const [tab, setTab] = useState<Tab>("users");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();
    const adminSet = new Set(adminIds);

    const flash: Flash = (result, okMessage) => {
        if (result.error) {
            setError(result.error);
            setSuccess(null);
        } else {
            setSuccess(okMessage);
            setError(null);
            router.refresh();
        }
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                        Manage users, rooms, and admins.
                    </p>
                </header>

                <nav className="flex flex-wrap gap-2 mb-6">
                    {(["users", "rooms", "admins"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`${tab === t ? "button-main" : "button-secondary"} capitalize text-sm`}
                        >
                            {t}
                            <span className="ml-2 text-xs opacity-70">
                                {t === "users" ? users.length : t === "rooms" ? rooms.length : adminIds.length}
                            </span>
                        </button>
                    ))}
                </nav>

                {(error || success) && (
                    <div
                        role="alert"
                        className={`mb-4 px-4 py-2 rounded-lg border-2 text-sm ${
                            error
                                ? "bg-red-100/80 border-red-500 text-red-700"
                                : "bg-green-100/80 border-green-500 text-green-700"
                        }`}
                    >
                        {error || success}
                    </div>
                )}

                {tab === "users" && (
                    <UsersTab
                        users={users}
                        adminSet={adminSet}
                        currentUserId={currentUserId}
                        flash={flash}
                    />
                )}
                {tab === "rooms" && <RoomsTab rooms={rooms} flash={flash} />}
                {tab === "admins" && (
                    <AdminsTab
                        users={users}
                        adminSet={adminSet}
                        currentUserId={currentUserId}
                        flash={flash}
                    />
                )}
            </div>
        </div>
    );
}

function UsersTab({
    users,
    adminSet,
    currentUserId,
    flash,
}: {
    users: AdminUserRow[];
    adminSet: Set<number>;
    currentUserId: number;
    flash: Flash;
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [pending, startTransition] = useTransition();
    const [query, setQuery] = useState("");

    const filtered = users.filter((u) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            String(u.id).includes(q)
        );
    });

    const onDelete = (id: number, name: string) => {
        if (!confirm(`Delete user "${name}" (id ${id})? This wipes their rooms, friends, blogs, and admin role.`))
            return;
        startTransition(async () => {
            const res = await adminDeleteUserAction(id);
            flash(res, `Deleted user ${name}.`);
        });
    };

    return (
        <section className="space-y-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search users by name, email, or id…" />

            <div className="card p-0 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {filtered.map((u) => (
                        <li key={u.id} className="px-4 py-3">
                            {editingId === u.id ? (
                                <UserEditRow
                                    user={u}
                                    onCancel={() => setEditingId(null)}
                                    onDone={() => setEditingId(null)}
                                    flash={flash}
                                />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-gray-400 w-10 shrink-0">#{u.id}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                                            {adminSet.has(u.id) && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                    <i className="bi bi-shield-fill"></i> admin
                                                </span>
                                            )}
                                            {u.id === currentUserId && (
                                                <span className="text-[10px] uppercase tracking-wider text-gray-400">you</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                        {u.description ? (
                                            <p className="text-xs text-gray-400 truncate">{u.description}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Link
                                            href={`/profile/${u.id}`}
                                            className="button-secondary text-xs"
                                        >
                                            <i className="bi bi-eye mr-1"></i>View
                                        </Link>
                                        <button
                                            onClick={() => setEditingId(u.id)}
                                            className="button-secondary text-xs"
                                        >
                                            <i className="bi bi-pencil mr-1"></i>Edit
                                        </button>
                                        <button
                                            disabled={pending || u.id === currentUserId}
                                            onClick={() => onDelete(u.id, u.name)}
                                            className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <i className="bi bi-trash mr-1"></i>Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-400">No users match.</li>
                    )}
                </ul>
            </div>
        </section>
    );
}

function UserEditRow({
    user,
    onCancel,
    onDone,
    flash,
}: {
    user: AdminUserRow;
    onCancel: () => void;
    onDone: () => void;
    flash: Flash;
}) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [description, setDescription] = useState(user.description ?? "");
    const [pending, startTransition] = useTransition();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await adminUpdateUserAction(user.id, name, email, description);
            flash(res, `Updated user ${name}.`);
            if (!res.error) onDone();
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-gray-500">
                Name
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                    required
                />
            </label>
            <label className="text-xs text-gray-500">
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                    required
                />
            </label>
            <label className="text-xs text-gray-500 sm:col-span-2">
                Description
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                />
            </label>
            <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={pending} className="button-main text-xs">
                    {pending ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={onCancel} className="button-secondary text-xs">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function RoomsTab({ rooms, flash }: { rooms: AdminRoomRow[]; flash: Flash }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [pending, startTransition] = useTransition();
    const [query, setQuery] = useState("");

    const filtered = rooms.filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            r.name.toLowerCase().includes(q) ||
            r.host_name.toLowerCase().includes(q) ||
            (r.invite_code ?? "").toLowerCase().includes(q) ||
            String(r.id).includes(q)
        );
    });

    const onDelete = (id: number, name: string) => {
        if (!confirm(`Delete room "${name}" (id ${id})?`)) return;
        startTransition(async () => {
            const res = await adminDeleteRoomAction(id);
            flash(res, `Deleted room ${name}.`);
        });
    };

    return (
        <section className="space-y-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search rooms by name, host, or code…" />

            <div className="card p-0 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {filtered.map((r) => (
                        <li key={r.id} className="px-4 py-3">
                            {editingId === r.id ? (
                                <RoomEditRow
                                    room={r}
                                    onCancel={() => setEditingId(null)}
                                    onDone={() => setEditingId(null)}
                                    flash={flash}
                                />
                            ) : (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-gray-400 w-10 shrink-0">#{r.id}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {r.publicity}
                                            </span>
                                            <span className="text-[10px] text-gray-400">code: {r.invite_code}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            host: {r.host_name} (#{r.host_id}) · max {r.max_members ?? "∞"}
                                        </p>
                                        {r.description ? (
                                            <p className="text-xs text-gray-400 truncate">{r.description}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Link href={`/room/${r.id}`} className="button-secondary text-xs">
                                            <i className="bi bi-box-arrow-in-right mr-1"></i>Open
                                        </Link>
                                        <button
                                            onClick={() => setEditingId(r.id)}
                                            className="button-secondary text-xs"
                                        >
                                            <i className="bi bi-pencil mr-1"></i>Edit
                                        </button>
                                        <button
                                            disabled={pending}
                                            onClick={() => onDelete(r.id, r.name)}
                                            className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                        >
                                            <i className="bi bi-trash mr-1"></i>Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-400">No rooms match.</li>
                    )}
                </ul>
            </div>
        </section>
    );
}

function RoomEditRow({
    room,
    onCancel,
    onDone,
    flash,
}: {
    room: AdminRoomRow;
    onCancel: () => void;
    onDone: () => void;
    flash: Flash;
}) {
    const [name, setName] = useState(room.name);
    const [description, setDescription] = useState(room.description ?? "");
    const [publicity, setPublicity] = useState(room.publicity);
    const [maxMembers, setMaxMembers] = useState(room.max_members === null ? "" : String(room.max_members));
    const [pending, startTransition] = useTransition();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await adminUpdateRoomAction(room.id, name, description, publicity, maxMembers);
            flash(res, `Updated room ${name}.`);
            if (!res.error) onDone();
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-gray-500 sm:col-span-2">
                Name
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                    required
                />
            </label>
            <label className="text-xs text-gray-500 sm:col-span-2">
                Description
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                />
            </label>
            <label className="text-xs text-gray-500">
                Publicity
                <select
                    value={publicity}
                    onChange={(e) => setPublicity(e.target.value)}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm bg-white"
                >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                </select>
            </label>
            <label className="text-xs text-gray-500">
                Max members
                <input
                    type="number"
                    min={1}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm"
                    placeholder="empty = no cap"
                />
            </label>
            <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={pending} className="button-main text-xs">
                    {pending ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={onCancel} className="button-secondary text-xs">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function AdminsTab({
    users,
    adminSet,
    currentUserId,
    flash,
}: {
    users: AdminUserRow[];
    adminSet: Set<number>;
    currentUserId: number;
    flash: Flash;
}) {
    const [pending, startTransition] = useTransition();
    const [query, setQuery] = useState("");
    const [grantId, setGrantId] = useState("");

    const admins = users.filter((u) => adminSet.has(u.id));
    const candidates = users
        .filter((u) => !adminSet.has(u.id))
        .filter((u) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                String(u.id).includes(q)
            );
        });

    const grant = (id: number, name: string) => {
        startTransition(async () => {
            const res = await adminGrantAdminAction(id);
            flash(res, `Promoted ${name} to admin.`);
        });
    };

    const revoke = (id: number, name: string) => {
        if (!confirm(`Revoke admin from "${name}"?`)) return;
        startTransition(async () => {
            const res = await adminRevokeAdminAction(id);
            flash(res, `Revoked admin from ${name}.`);
        });
    };

    const grantById = (e: React.FormEvent) => {
        e.preventDefault();
        const id = Number(grantId);
        if (!Number.isFinite(id) || id < 1) {
            flash({ error: "Enter a valid user id." }, "");
            return;
        }
        startTransition(async () => {
            const res = await adminGrantAdminAction(id);
            flash(res, `Promoted user #${id} to admin.`);
            if (!res.error) setGrantId("");
        });
    };

    return (
        <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">Current admins</h2>
                <div className="card p-0 overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {admins.map((u) => (
                            <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-10 shrink-0">#{u.id}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {u.name}
                                        {u.id === currentUserId && (
                                            <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-400">you</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                </div>
                                <button
                                    disabled={pending || u.id === currentUserId}
                                    onClick={() => revoke(u.id, u.name)}
                                    className="text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Revoke
                                </button>
                            </li>
                        ))}
                        {admins.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-gray-400">
                                No admins yet.
                            </li>
                        )}
                    </ul>
                </div>

                <form onSubmit={grantById} className="card flex gap-2 items-end">
                    <label className="flex-1 text-xs text-gray-500">
                        Promote by user id
                        <input
                            value={grantId}
                            onChange={(e) => setGrantId(e.target.value)}
                            placeholder="e.g. 5"
                            className="mt-1 px-2 py-1 w-full border border-gray-300 rounded-md text-sm bg-white"
                        />
                    </label>
                    <button type="submit" disabled={pending} className="button-main text-xs">
                        Promote
                    </button>
                </form>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold">Promote a user</h2>
                <SearchInput value={query} onChange={setQuery} placeholder="Search non-admin users…" />
                <div className="card p-0 overflow-hidden max-h-[60vh] overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                        {candidates.map((u) => (
                            <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-10 shrink-0">#{u.id}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                                </div>
                                <button
                                    disabled={pending}
                                    onClick={() => grant(u.id, u.name)}
                                    className="button-main text-xs"
                                >
                                    Promote
                                </button>
                            </li>
                        ))}
                        {candidates.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-gray-400">
                                No matching users.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function SearchInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
        </div>
    );
}
