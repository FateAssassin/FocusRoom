import "server-only";
import db from "./db";

export function isAdmin(userId: number): boolean {
    if (!Number.isFinite(userId)) return false;
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

export function listAdminIds(): number[] {
    try {
        const rows = db
            .prepare("SELECT user_id FROM admins")
            .all() as { user_id: number }[];
        return rows.map((r) => r.user_id);
    } catch (err) {
        console.error("listAdminIds failed:", err);
        return [];
    }
}

export function addAdmin(userId: number): void {
    db.prepare("INSERT OR IGNORE INTO admins (user_id) VALUES (?)").run(userId);
}

export function removeAdmin(userId: number): void {
    db.prepare("DELETE FROM admins WHERE user_id = ?").run(userId);
}
