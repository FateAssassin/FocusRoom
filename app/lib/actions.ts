'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/auth-options";
import db from "./db/db";
import {
    addFriend as addFriendRow,
    removeFriend as removeFriendRow,
} from "./db/friends";

export type JoinRoomState = { error?: string };

export async function joinRoomByCode(
    _prev: JoinRoomState | undefined,
    formData: FormData,
): Promise<JoinRoomState> {
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

    redirect(`/rooms/${room.id}`);
}

export type FriendActionResult = { error?: string };

export async function addFriendAction(friendId: number): Promise<FriendActionResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "You must be signed in." };
    }
    const me = Number(session.user.id);
    if (!Number.isFinite(friendId) || friendId === me) {
        return { error: "Invalid user." };
    }
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(friendId);
    if (!target) {
        return { error: "User not found." };
    }
    addFriendRow(me, friendId);
    revalidatePath(`/profile/${friendId}`);
    revalidatePath(`/friends`);
    return {};
}

export async function removeFriendAction(friendId: number): Promise<FriendActionResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: "You must be signed in." };
    }
    const me = Number(session.user.id);
    if (!Number.isFinite(friendId)) {
        return { error: "Invalid user." };
    }
    removeFriendRow(me, friendId);
    revalidatePath(`/profile/${friendId}`);
    revalidatePath(`/friends`);
    return {};
}
