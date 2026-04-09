import db from "./db";

export interface User {
    id: number;
    email: string;
    name: string;
    profile_picture_link: string | null;
    description: string | null;
    created_at: string;
}  

export function getUserById(id: number): User | undefined {
    const user = db.prepare(`
        SELECT id, name, email, description, created_at, profile_picture_link
        FROM users
        WHERE id = ?
    `).get(id) as User | undefined;
    if (!user) {
        return undefined;
    }
    return user;
}

export function updateUserProfilePicture(id: number, profilePictureLink: string | null): void {
    db.prepare(`
        UPDATE users
        SET profile_picture_link = ?
        WHERE id = ?
    `).run(profilePictureLink, id);
}

export function updateUserDescription(id: number, description: string | null): void {
    console.log("Updating description for user ID", id, "to:", description);
    db.prepare(`
        UPDATE users
        SET description = ?
        WHERE id = ?
    `).run(description, id);
}