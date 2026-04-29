import db from "./db";

export function isAdmin(userId: number): boolean {
    try {
        const row = db
            .prepare("SELECT 1 AS ok FROM admins WHERE user_id = ?")
            .get(userId) as { ok: number } | undefined;
        console.log(`isAdmin check for userId ${userId}:`, row);
        return !!row;
    } catch (err) {
        console.error("isAdmin failed:", err);
        return false;
    }
}
