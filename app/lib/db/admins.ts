import db from "./db";

export function isAdmin(userId: number): boolean {
    try {
        const row = db
            .prepare("SELECT 1 AS ok FROM admins WHERE user_id = ?")
            .get(userId) as { ok: number } | undefined;
        return !!row;
    } catch (err) {
        console.error("isAdmin failed:", err);
        return false;
    }
}
