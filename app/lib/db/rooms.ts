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
export function getRoomByHostId(hostId: number) {
    const stmt = db.prepare("SELECT * FROM rooms WHERE host_Id = ?");
    const room = stmt.get(hostId);
    return room;
}
export function getRoomById(roomId: number) {
    const stmt = db.prepare("SELECT * FROM rooms WHERE id = ?");
    const room = stmt.get(roomId);
    return room;
}
export function getAllRooms() {
    const stmt = db.prepare("SELECT * FROM rooms");
    const rooms = stmt.all();
    return rooms;
}
export function updateRoom(roomId: number, roomName: string, description: string, publicity: string, maxMembers: number | null) {
    const stmt = db.prepare("UPDATE rooms SET roomName = ?, description = ?, publicity = ?, maxMembers = ? WHERE id = ?");
    const info = stmt.run(roomName, description, publicity, maxMembers, roomId);
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