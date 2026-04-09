type Room = {
    id: number;
    host_id: number;
    name: string;
    description: string;
    publicity: boolean;
    created_at: string;
    updated_at: string;
    max_members: number;
    invite_code: string;
    empty_since: string | null;
}

export let rooms: Room[] = [];

export function addRoom(room: Room) {
    rooms.push(room);
}
export function getRooms() {
    return rooms;
}
export function getRoomById(id: number) {
    return rooms.find(room => room.id === id);
}
export function updateRoom(updatedRoom: Room) {
    const index = rooms.findIndex(room => room.id === updatedRoom.id);
    if (index !== -1) {
        rooms[index] = updatedRoom;
    }
}
export function deleteRoom(id: number) {
    rooms = rooms.filter(room => room.id !== id);
}