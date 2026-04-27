import db from "./db";

export type Room = {
    id: number | null;
    host_id: number;
    name: string;
    description: string;
    publicity: string;
    created_at: string;
    updated_at: string;
    max_members: number;
    invite_code: string;
    empty_since: string | null;
}

export type RoomMutationResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

function errorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export function createRoom(room: Room): RoomMutationResult<Room> {
    try {
        const stmt = db.prepare("INSERT INTO rooms (host_id, name, description, publicity, created_at, updated_at, max_members, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        const info = stmt.run(room.host_id, room.name, room.description, room.publicity, room.created_at, room.updated_at, room.max_members, room.invite_code);
        return { ok: true, data: { ...room, id: Number(info.lastInsertRowid) } };
    } catch (err) {
        console.error("createRoom failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to create room") };
    }
}
export function getRoomByHostId(hostId: number): Room | undefined {
    try {
        const stmt = db.prepare("SELECT * FROM rooms WHERE host_Id = ?");
        return stmt.get(hostId) as Room | undefined;
    } catch (err) {
        console.error("getRoomByHostId failed:", err);
        return undefined;
    }
}
export function getRoomById(roomId: number): Room | undefined {
    try {
        const stmt = db.prepare("SELECT * FROM rooms WHERE id = ?");
        return stmt.get(roomId) as Room | undefined;
    } catch (err) {
        console.error("getRoomById failed:", err);
        return undefined;
    }
}
export function getAllRooms(): Room[] {
    try {
        const stmt = db.prepare("SELECT * FROM rooms");
        return stmt.all() as Room[];
    } catch (err) {
        console.error("getAllRooms failed:", err);
        return [];
    }
}
export function updateRoom(roomId: number, name: string, description: string, publicity: string, maxMembers: number | null): RoomMutationResult<{ changes: number }> {
    try {
        const stmt = db.prepare("UPDATE rooms SET name = ?, description = ?, publicity = ?, max_members = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        const info = stmt.run(name, description, publicity, maxMembers, roomId);
        return { ok: true, data: { changes: info.changes } };
    } catch (err) {
        console.error("updateRoom failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to update room") };
    }
}
export function deleteRoom(roomId: number): RoomMutationResult<{ changes: number }> {
    try {
        const stmt = db.prepare("DELETE FROM rooms WHERE id = ?");
        const info = stmt.run(roomId);
        return { ok: true, data: { changes: info.changes } };
    } catch (err) {
        console.error("deleteRoom failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to delete room") };
    }
}
export function deleteRoomsByHostId(hostId: number): RoomMutationResult<{ changes: number }> {
    try {
        const stmt = db.prepare("DELETE FROM rooms WHERE host_Id = ?");
        const info = stmt.run(hostId);
        return { ok: true, data: { changes: info.changes } };
    } catch (err) {
        console.error("deleteRoomsByHostId failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to delete rooms") };
    }
}