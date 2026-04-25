import db from "./db";

type Room = {
    id: number;
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

export function createRoom(Room: Room) {   
    const stmt = db.prepare("INSERT INTO rooms (host_id, name, description, publicity, created_at, updated_at, max_members, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(Room.host_id, Room.name, Room.description, Room.publicity, Room.created_at, Room.updated_at, Room.max_members, Room.invite_code);
    return info;
}
export function getRoomByHostId(hostId: number): Room | undefined {
    const stmt = db.prepare("SELECT * FROM rooms WHERE host_Id = ?");
    return stmt.get(hostId) as Room | undefined;
}
export function getRoomById(roomId: number): Room | undefined {
    const stmt = db.prepare("SELECT * FROM rooms WHERE id = ?");
    return stmt.get(roomId) as Room | undefined;
}
export function getAllRooms(): Room[] {
    const stmt = db.prepare("SELECT * FROM rooms");
    return stmt.all() as Room[];
}
export function updateRoom(roomId: number, name: string, description: string, publicity: string, maxMembers: number | null) {
    const stmt = db.prepare("UPDATE rooms SET name = ?, description = ?, publicity = ?, max_members = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    const info = stmt.run(name, description, publicity, maxMembers, roomId);
    return info;
}
export function deleteRoom(roomId: number) {
    const stmt = db.prepare("DELETE FROM rooms WHERE id = ?");
    const info = stmt.run(roomId);
    return info;
}
export function deleteRoomsByHostId(hostId: number) {
    const stmt = db.prepare("DELETE FROM rooms WHERE host_Id = ?");
    const info = stmt.run(hostId);
    return info;
}