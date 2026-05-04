'use server';

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/auth-options";
import db from "./db/db";
import { addAdmin, isAdmin, removeAdmin } from "./db/admins";
import { deleteRoom, updateRoom } from "./db/rooms";

export type AdminActionResult = { ok?: boolean; error?: string };

async function requireAdmin(): Promise<{ id: number } | { error: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "You must be signed in." };
    const id = Number(session.user.id);
    if (!Number.isFinite(id)) return { error: "Invalid session." };
    if (!isAdmin(id)) return { error: "Forbidden." };
    return { id };
}

function errorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export async function adminUpdateUserAction(
    userId: number,
    name: string,
    email: string,
    description: string,
): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(userId)) return { error: "Invalid user id." };

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName) return { error: "Name is required." };
    if (!trimmedEmail) return { error: "Email is required." };

    try {
        db.prepare(
            "UPDATE users SET name = ?, email = ?, description = ? WHERE id = ?"
        ).run(trimmedName, trimmedEmail, trimmedDesc || null, userId);
    } catch (err) {
        return { error: errorMessage(err, "Failed to update user.") };
    }

    revalidatePath("/admin");
    return { ok: true };
}

export async function adminDeleteUserAction(userId: number): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(userId)) return { error: "Invalid user id." };
    if (userId === ctx.id) return { error: "You cannot delete your own account here." };

    try {
        const tx = db.transaction((id: number) => {
            db.prepare("DELETE FROM rooms WHERE host_id = ?").run(id);
            db.prepare("DELETE FROM friends WHERE user_id = ? OR friend_id = ?").run(id, id);
            db.prepare("DELETE FROM admins WHERE user_id = ?").run(id);
            db.prepare("DELETE FROM profile_pictures WHERE user_id = ?").run(id);
            db.prepare("DELETE FROM blogs WHERE author_id = ?").run(id);
            db.prepare("DELETE FROM users WHERE id = ?").run(id);
        });
        tx(userId);
    } catch (err) {
        return { error: errorMessage(err, "Failed to delete user.") };
    }

    revalidatePath("/admin");
    return { ok: true };
}

export async function adminUpdateRoomAction(
    roomId: number,
    name: string,
    description: string,
    publicity: string,
    maxMembersRaw: string,
): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(roomId)) return { error: "Invalid room id." };

    const trimmedName = name.trim();
    if (!trimmedName) return { error: "Room name is required." };
    if (publicity !== "public" && publicity !== "private") {
        return { error: "Publicity must be public or private." };
    }

    let maxMembers: number | null = null;
    const raw = maxMembersRaw.trim();
    if (raw !== "") {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 1) {
            return { error: "Max members must be a positive number." };
        }
        maxMembers = Math.floor(n);
    }

    const result = updateRoom(roomId, trimmedName, description.trim(), publicity, maxMembers);
    if (!result.ok) return { error: result.error };

    revalidatePath("/admin");
    return { ok: true };
}

export async function adminDeleteRoomAction(roomId: number): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(roomId)) return { error: "Invalid room id." };

    const result = deleteRoom(roomId);
    if (!result.ok) return { error: result.error };

    revalidatePath("/admin");
    return { ok: true };
}

export async function adminGrantAdminAction(userId: number): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(userId)) return { error: "Invalid user id." };

    const exists = db.prepare("SELECT 1 FROM users WHERE id = ?").get(userId);
    if (!exists) return { error: "User not found." };

    addAdmin(userId);
    revalidatePath("/admin");
    return { ok: true };
}

export async function adminRevokeAdminAction(userId: number): Promise<AdminActionResult> {
    const ctx = await requireAdmin();
    if ("error" in ctx) return { error: ctx.error };
    if (!Number.isFinite(userId)) return { error: "Invalid user id." };
    if (userId === ctx.id) return { error: "You cannot revoke your own admin status." };

    removeAdmin(userId);
    revalidatePath("/admin");
    return { ok: true };
}
