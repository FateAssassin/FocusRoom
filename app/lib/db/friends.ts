import db from "./db";

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

export function addFriend(userId: number, friendId: number): void {
    db.prepare(
        `INSERT OR IGNORE INTO friends (user_id, friend_id, accepted) VALUES (?, ?, 1)`
    ).run(userId, friendId);
}

export function removeFriend(userId: number, friendId: number): void {
    db.prepare(
        `DELETE FROM friends
         WHERE (user_id = ? AND friend_id = ?)
            OR (user_id = ? AND friend_id = ?)`
    ).run(userId, friendId, friendId, userId);
}

export function areFriends(a: number, b: number): boolean {
    const row = db.prepare(
        `SELECT 1 FROM friends
         WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
           AND accepted = 1`
    ).get(a, b, b, a);
    return !!row;
}

export function getFriendsWithRooms(userId: number): FriendWithRoom[] {
    const friends = db.prepare(`
        SELECT u.id, u.name, u.profile_picture_link, u.description
        FROM friends f
        JOIN users u
          ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
        WHERE (f.user_id = ? OR f.friend_id = ?)
          AND f.accepted = 1
        ORDER BY u.name COLLATE NOCASE
    `).all(userId, userId, userId) as {
        id: number;
        name: string;
        profile_picture_link: string | null;
        description: string | null;
    }[];

    const roomStmt = db.prepare(
        `SELECT id, name, description, publicity, invite_code
         FROM rooms WHERE host_id = ? LIMIT 1`
    );

    return friends.map((u) => ({
        ...u,
        room: (roomStmt.get(u.id) as FriendRoom | undefined) ?? null,
    }));
}
