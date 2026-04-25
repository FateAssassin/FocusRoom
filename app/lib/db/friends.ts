import db from "./db";

export type FriendshipStatus = "none" | "friends" | "outgoing" | "incoming";

export type FriendRoom = {
    id: number;
    name: string;
    description: string | null;
    publicity: string;
    invite_code: string;
};

export type FriendWithRoom = {
    id: number;
    name: string;
    profile_picture_link: string | null;
    description: string | null;
    room: FriendRoom | null;
};

export type PendingRequest = {
    id: number;
    name: string;
    profile_picture_link: string | null;
    description: string | null;
    created_at: string;
};

export function getFriendshipStatus(me: number, other: number): FriendshipStatus {
    const outgoing = db
        .prepare(`SELECT accepted FROM friends WHERE user_id = ? AND friend_id = ?`)
        .get(me, other) as { accepted: number } | undefined;
    const incoming = db
        .prepare(`SELECT accepted FROM friends WHERE user_id = ? AND friend_id = ?`)
        .get(other, me) as { accepted: number } | undefined;

    if ((outgoing && outgoing.accepted === 1) || (incoming && incoming.accepted === 1)) {
        return "friends";
    }
    if (outgoing && outgoing.accepted === 0) return "outgoing";
    if (incoming && incoming.accepted === 0) return "incoming";
    return "none";
}

export function sendFriendRequest(fromId: number, toId: number): FriendshipStatus {
    const status = getFriendshipStatus(fromId, toId);
    if (status === "friends" || status === "outgoing") return status;
    if (status === "incoming") {
        db.prepare(
            `UPDATE friends SET accepted = 1 WHERE user_id = ? AND friend_id = ? AND accepted = 0`
        ).run(toId, fromId);
        return "friends";
    }
    db.prepare(
        `INSERT OR IGNORE INTO friends (user_id, friend_id, accepted) VALUES (?, ?, 0)`
    ).run(fromId, toId);
    return "outgoing";
}

export function acceptFriendRequest(me: number, requesterId: number): boolean {
    const info = db
        .prepare(
            `UPDATE friends SET accepted = 1 WHERE user_id = ? AND friend_id = ? AND accepted = 0`
        )
        .run(requesterId, me);
    return info.changes > 0;
}

export function declineFriendRequest(me: number, requesterId: number): void {
    db.prepare(
        `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND accepted = 0`
    ).run(requesterId, me);
}

export function cancelFriendRequest(me: number, targetId: number): void {
    db.prepare(
        `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND accepted = 0`
    ).run(me, targetId);
}

export function removeFriend(a: number, b: number): void {
    db.prepare(
        `DELETE FROM friends
         WHERE accepted = 1
           AND ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))`
    ).run(a, b, b, a);
}

export function getFriendsWithRooms(userId: number): FriendWithRoom[] {
    const rows = db
        .prepare(`
            SELECT u.id, u.name, u.profile_picture_link, u.description
            FROM friends f
            JOIN users u
              ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
            WHERE (f.user_id = ? OR f.friend_id = ?)
              AND f.accepted = 1
            ORDER BY u.name COLLATE NOCASE
        `)
        .all(userId, userId, userId) as {
            id: number;
            name: string;
            profile_picture_link: string | null;
            description: string | null;
        }[];

    const roomStmt = db.prepare(
        `SELECT id, name, description, publicity, invite_code
         FROM rooms WHERE host_id = ? LIMIT 1`
    );
    return rows.map((u) => ({
        ...u,
        room: (roomStmt.get(u.id) as FriendRoom | undefined) ?? null,
    }));
}

export function getIncomingRequests(userId: number): PendingRequest[] {
    return db
        .prepare(`
            SELECT u.id, u.name, u.profile_picture_link, u.description, f.created_at
            FROM friends f
            JOIN users u ON u.id = f.user_id
            WHERE f.friend_id = ? AND f.accepted = 0
            ORDER BY f.created_at DESC
        `)
        .all(userId) as PendingRequest[];
}

export function getOutgoingRequests(userId: number): PendingRequest[] {
    return db
        .prepare(`
            SELECT u.id, u.name, u.profile_picture_link, u.description, f.created_at
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ? AND f.accepted = 0
            ORDER BY f.created_at DESC
        `)
        .all(userId) as PendingRequest[];
}

export function countIncomingRequests(userId: number): number {
    const row = db
        .prepare(`SELECT COUNT(*) AS c FROM friends WHERE friend_id = ? AND accepted = 0`)
        .get(userId) as { c: number };
    return row.c;
}