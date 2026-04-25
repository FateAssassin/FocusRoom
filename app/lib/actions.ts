'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/auth-options";
import db from "./db/db";
import {
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    removeFriend,
    sendFriendRequest,
    type FriendshipStatus,
} from "./db/friends";
import {
    deleteRoomsByHostId,
    getRoomByHostId,
    updateRoom,
} from "./db/rooms";
import { rateLimit, retryAfterSeconds } from "./rate-limit";

export type JoinRoomState = { error?: string };

const JOIN_ROOM_LIMIT = { limit: 10, windowMs: 60 * 1000 };

export async function joinRoomByCode(
    _prev: JoinRoomState | undefined,
    formData: FormData,
): Promise<JoinRoomState> {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ip = fwd
        ? fwd.split(",")[0].trim()
        : (h.get("x-real-ip")?.trim() ?? "unknown");
    const limit = rateLimit(`joinRoom:${ip}`, JOIN_ROOM_LIMIT);
    if (!limit.ok) {
        return {
            error: `Too many attempts. Try again in ${retryAfterSeconds(limit.resetAt)}s.`,
        };
    }

    const code = String(formData.get("code") ?? "").trim();
    if (!code) {
        return { error: "Please enter an invite code." };
    }

    const room = db
        .prepare("SELECT id FROM rooms WHERE invite_code = ? COLLATE NOCASE")
        .get(code) as { id: number } | undefined;

    if (!room) {
        return { error: "No room found with that code." };
    }

    redirect(`/room/${room.id}`);
}

export type FriendActionResult = {
    error?: string;
    nextStatus?: FriendshipStatus;
};

async function currentUserId(): Promise<number | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    const me = Number(session.user.id);
    return Number.isFinite(me) ? me : null;
}

function revalidateFriendPages(otherId: number) {
    revalidatePath(`/profile/${otherId}`);
    revalidatePath(`/friends`);
}

export async function sendFriendRequestAction(targetId: number): Promise<FriendActionResult> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    if (!Number.isFinite(targetId) || targetId === me) {
        return { error: "Invalid user." };
    }
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(targetId);
    if (!target) return { error: "User not found." };

    const nextStatus = sendFriendRequest(me, targetId);
    revalidateFriendPages(targetId);
    return { nextStatus };
}

export async function cancelFriendRequestAction(targetId: number): Promise<FriendActionResult> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    cancelFriendRequest(me, targetId);
    revalidateFriendPages(targetId);
    return { nextStatus: "none" };
}

export async function acceptFriendRequestAction(requesterId: number): Promise<FriendActionResult> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    const accepted = acceptFriendRequest(me, requesterId);
    revalidateFriendPages(requesterId);
    return { nextStatus: accepted ? "friends" : "none" };
}

export async function declineFriendRequestAction(requesterId: number): Promise<FriendActionResult> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    declineFriendRequest(me, requesterId);
    revalidateFriendPages(requesterId);
    return { nextStatus: "none" };
}

export async function removeFriendAction(friendId: number): Promise<FriendActionResult> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    removeFriend(me, friendId);
    revalidateFriendPages(friendId);
    return { nextStatus: "none" };
}

export type RoomActionState = { error?: string; ok?: boolean };

export async function deleteMyRoomAction(): Promise<RoomActionState> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };
    deleteRoomsByHostId(me);
    revalidatePath("/rooms");
    return { ok: true };
}

export async function updateMyRoomAction(
    _prev: RoomActionState | undefined,
    formData: FormData,
): Promise<RoomActionState> {
    const me = await currentUserId();
    if (me === null) return { error: "You must be signed in." };

    const room = getRoomByHostId(me);
    if (!room) return { error: "You don't have a room." };

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const publicity = String(formData.get("publicity") ?? "public").trim();
    const maxRaw = String(formData.get("max_members") ?? "").trim();

    if (!name) return { error: "Room name is required." };
    if (publicity !== "public" && publicity !== "private") {
        return { error: "Publicity must be public or private." };
    }
    let maxMembers: number | null = null;
    if (maxRaw !== "") {
        const n = Number(maxRaw);
        if (!Number.isFinite(n) || n < 1) {
            return { error: "Max members must be a positive number." };
        }
        maxMembers = Math.floor(n);
    }

    updateRoom(room.id, name, description, publicity, maxMembers);
    revalidatePath("/rooms");
    return { ok: true };
}